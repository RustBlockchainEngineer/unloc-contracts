use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use unloc_staking::{
    cpi::accounts::{CreatePoolUser, Stake},
    program::UnlocStaking,
    states::StateAccount,
};
use crate::{constant::*, states::*, utils::*, error::*};
use std::str::FromStr;

pub fn handle(ctx: Context<ClaimBorrowerRewards>) -> Result<()> {
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let reward_vault_amount = ctx.accounts.reward_vault.amount;
    ctx.accounts.global_state.distribute(
        reward_vault_amount,
        current_time,
        &ctx.accounts.chainlink_program.to_account_info(),
        &ctx.accounts.sol_feed.to_account_info(),
        &ctx.accounts.usdc_feed.to_account_info(),
    )?;
    if ctx.accounts.sub_offer.state == SubOfferState::get_state(SubOfferState::Accepted) {
        let offer_mint = ctx.accounts.sub_offer.offer_mint;
        ctx.accounts
            .sub_offer
            .update_rps(&ctx.accounts.global_state, &offer_mint)?;
    }

    let clock = Clock::get().unwrap();
    let is_valid_redemption = validate_redeem_time(
            ctx.accounts.sub_offer.last_borrower_claim,
            clock.unix_timestamp,
            ctx.accounts.global_state.redemption_reset
        ).unwrap();
        
    msg!("Is valid redemption based on last redemption time: {}", is_valid_redemption);
    if ctx.accounts.sub_offer.borrower_has_claimed_rewards && !is_valid_redemption {
        return Err(error!(LoanError::CooldownPeriod));
    }

    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    // let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    // let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    require(ctx.accounts.borrower_reward_vault.mint == unloc_mint, "borrower_reward_vault.mint")?;
    require(ctx.accounts.borrower_reward_vault.owner == ctx.accounts.sub_offer.borrower, "borrower_reward_vault.owner")?;

    let is_borrower = ctx.accounts.sub_offer.borrower == ctx.accounts.authority.key();
    authorize_account(is_borrower, "is_borrower")?;

    let total_point = ctx.accounts.sub_offer.total_point;
    let collection_point = ctx.accounts.sub_offer.collection_point;

    let full_reward_amount = ctx.accounts.sub_offer.pending_borrower_rewards()?;
    let reward_amount = if total_point == 0 {
        0
    } else {
        calc_fee_u128(full_reward_amount, collection_point, total_point)?
    };

    let denominator = ctx.accounts.global_state.denominator;
    let lender_rewards_percentage = ctx.accounts.global_state.lender_rewards_percentage;
    let lender_rewards_amount = calc_fee(reward_amount, lender_rewards_percentage, denominator)?;
    let borrower_rewards_amount = reward_amount.safe_sub(lender_rewards_amount)?;

    let global_bump = ctx.accounts.global_state.bump;
    let global_seeds = &[GLOBAL_STATE_TAG, &[global_bump]];
    let signer = &[&global_seeds[..]];

    // create user staking account if not created yet
    if ctx.accounts.stake_user.data_is_empty() {
        unloc_staking::cpi::create_user(ctx.accounts.create_user_ctx().with_signer(signer), ctx.accounts.stake_state.liquidity_mining_stake_seed)?;
    }

    // stake rewards
    unloc_staking::cpi::stake(ctx.accounts.stake_ctx().with_signer(signer), borrower_rewards_amount, DEFAULT_STAKE_DURATION)?;

    ctx.accounts.sub_offer.update_borrower_reward_debt()?;
    ctx.accounts.sub_offer.last_borrower_claim = clock.unix_timestamp;
    ctx.accounts.sub_offer.borrower_has_claimed_rewards = true;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimBorrowerRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(mut,
        seeds = [SUB_OFFER_TAG, sub_offer.offer.as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
        bump = sub_offer.bump,
        )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump = global_state.reward_vault_bump,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: Safe
    pub chainlink_program: AccountInfo<'info>,
    /// CHECK: Safe
    pub sol_feed: AccountInfo<'info>,
    /// CHECK: Safe
    pub usdc_feed: AccountInfo<'info>,
    #[account(mut)]
    pub borrower_reward_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: Safe
    #[account(mut)]
    pub stake_user: AccountInfo<'info>,
    #[account(mut, owner = unloc_staking_program.key())]
    pub stake_state: Account<'info, StateAccount>,
    /// CHECK: Safe
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,
    
    /// CHECK: Safe
    #[account(owner = *unloc_staking_program.key)]
    pub extra_reward_account: AccountInfo<'info>,
    /// CHECK: Safe
    pub stake_mint: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub stake_pool_vault: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub fee_vault: AccountInfo<'info>,

    pub unloc_staking_program: Program<'info, UnlocStaking>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}


impl<'info> ClaimBorrowerRewards<'info> {

    pub fn create_user_ctx(&self) -> CpiContext<'_, '_, '_, 'info, CreatePoolUser<'info>> {
        let unloc_staking_program = self.unloc_staking_program.to_account_info();
        let create_user_accts = CreatePoolUser {
            user: self.stake_user.to_account_info(),
            state: self.stake_state.to_account_info(),
            pool: self.stake_pool.to_account_info(),
            authority: self.global_state.to_account_info(),
            payer: self.authority.to_account_info(),
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info()
        };

        CpiContext::new(unloc_staking_program, create_user_accts)
    }

    pub fn stake_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Stake<'info>> {
        let unloc_staking_program = self.unloc_staking_program.to_account_info();
        let stake_accts = Stake {
            user: self.stake_user.to_account_info(),
            state: self.stake_state.to_account_info(),
            extra_reward_account: self.extra_reward_account.to_account_info(),
            pool: self.stake_pool.to_account_info(),
            authority: self.global_state.to_account_info(),
            mint: self.stake_mint.to_account_info(),
            pool_vault: self.stake_pool_vault.to_account_info(),
            user_vault: self.reward_vault.to_account_info(),
            fee_vault: self.fee_vault.to_account_info(),
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
            clock: self.clock.to_account_info()
        };

        CpiContext::new(unloc_staking_program, stake_accts)
    }
}
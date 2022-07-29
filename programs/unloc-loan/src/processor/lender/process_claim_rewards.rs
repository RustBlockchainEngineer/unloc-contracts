use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{constant::*, states::*, utils::*};
use std::str::FromStr;

pub fn handle(ctx: Context<ClaimRewards>) -> Result<()> {
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

    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    // let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    // let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    require(ctx.accounts.lender_reward_vault.mint == unloc_mint, "lender_reward_vault.mint")?;
    require(ctx.accounts.borrower_reward_vault.mint == unloc_mint, "borrower_reward_vault.mint")?;
    require(ctx.accounts.lender_reward_vault.owner == ctx.accounts.sub_offer.lender, "lender_reward_vault.owner")?;
    require(ctx.accounts.borrower_reward_vault.owner == ctx.accounts.sub_offer.borrower, "borrower_reward_vault.owner")?;

    let is_lender = ctx.accounts.sub_offer.lender == ctx.accounts.authority.key();
    let is_borrower = ctx.accounts.sub_offer.borrower == ctx.accounts.authority.key();
    require(is_lender || is_borrower, "is_lender || is_borrower")?;

    let total_point = ctx.accounts.sub_offer.total_point;
    let collection_point = ctx.accounts.sub_offer.collection_point;

    let full_reward_amount = ctx.accounts.sub_offer.pending_rewards()?;
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
    let signer_seeds = &[GLOBAL_STATE_TAG, &[global_bump]];
    let signer = &[&signer_seeds[..]];

    // transfer to lender
    let cpi_accounts1 = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.lender_reward_vault.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };
    let cpi_program1 = ctx.accounts.token_program.to_account_info();
    let cpi_ctx1 = CpiContext::new_with_signer(cpi_program1, cpi_accounts1, signer);
    token::transfer(cpi_ctx1, lender_rewards_amount)?;

    let cpi_accounts2 = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.borrower_reward_vault.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };
    let cpi_program2 = ctx.accounts.token_program.to_account_info();
    let cpi_ctx2 = CpiContext::new_with_signer(cpi_program2, cpi_accounts2, signer);
    token::transfer(cpi_ctx2, borrower_rewards_amount)?;

    ctx.accounts.sub_offer.update_reward_debt()?;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
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
    pub lender_reward_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub borrower_reward_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

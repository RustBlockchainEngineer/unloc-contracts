use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;
use std::cmp;

pub fn process_claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { 
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    // let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    require(ctx.accounts.user_reward_vault.mint == unloc_mint)?;
    require(ctx.accounts.user_reward_vault.owner == ctx.accounts.authority.key())?;
    let is_lender = ctx.accounts.user_reward.lender == ctx.accounts.authority.key();
    let is_borrower = ctx.accounts.user_reward.borrower == ctx.accounts.authority.key();
    require(is_lender || is_borrower)?;

    let total_point = ctx.accounts.user_reward.total_point;
    let collection_point = ctx.accounts.user_reward.collection_point;
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let start_time = ctx.accounts.user_reward.start_time;
    let end_time = ctx.accounts.user_reward.end_time;
    let last_claimed_time = if is_lender {ctx.accounts.user_reward.lender_last_claimed_time} else {ctx.accounts.user_reward.borrower_last_claimed_time};
    let max_duration = ctx.accounts.user_reward.max_duration;
    let loan_amount = ctx.accounts.user_reward.loan_amount;
    let loan_mint = ctx.accounts.user_reward.loan_mint;
    let loan_mint_decimals = ctx.accounts.user_reward.loan_mint_decimals;
    let token_per_second = if wsol_mint ==  loan_mint {ctx.accounts.global_state.reward_per_sol} else {ctx.accounts.global_state.reward_per_usdc};
    let reward_end_time = cmp::min(start_time.checked_add(max_duration).unwrap(), cmp::min(current_time, end_time));
    let reward_duration = reward_end_time.checked_sub(last_claimed_time).unwrap();
    let decimals = 10u64.pow(loan_mint_decimals as u32);

    let full_reward_amount = calc_fee(reward_duration.checked_mul(token_per_second).unwrap(), loan_amount, decimals)?;
    let reward_amount = if total_point == 0 {0} else {calc_fee_u128(full_reward_amount, collection_point, total_point)?};
    
    let denominator = ctx.accounts.global_state.denominator;
    let lender_rewards_percentage = ctx.accounts.global_state.lender_rewards_percentage;
    let percentage = if is_lender {lender_rewards_percentage} else {denominator - lender_rewards_percentage};
    let final_rewards_amount = calc_fee(reward_amount, percentage, denominator)?;

    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_reward_vault.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let signer_seeds = &[
        GLOBAL_STATE_TAG, 
        &[bump(&[
            GLOBAL_STATE_TAG, 
        ], ctx.program_id)],
    ];
    let signer = &[&signer_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, final_rewards_amount)?;
    if is_lender {
        ctx.accounts.user_reward.lender_claimed_amount = ctx.accounts.user_reward.lender_claimed_amount.checked_add(final_rewards_amount).unwrap();
        ctx.accounts.user_reward.lender_last_claimed_time = reward_end_time;
    } else {
        ctx.accounts.user_reward.borrower_claimed_amount = ctx.accounts.user_reward.borrower_claimed_amount.checked_add(final_rewards_amount).unwrap();
        ctx.accounts.user_reward.borrower_last_claimed_time = reward_end_time;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub authority:  Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [LENDER_REWARD_TAG, user_reward.lender.as_ref(), user_reward.borrower.as_ref(), user_reward.sub_offer.as_ref()],
        bump,
        )]
    pub user_reward:Box<Account<'info, LenderReward>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user_reward_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

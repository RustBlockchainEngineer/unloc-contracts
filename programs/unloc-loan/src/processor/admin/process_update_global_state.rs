use crate::{constant::*, states::*};
use anchor_lang::prelude::*;

pub fn handle(
    ctx: Context<UpdateGlobalState>,
    accrued_interest_numerator: u64,
    denominator: u64,
    min_repaid_numerator: u64,
    apr_numerator: u64,
    expire_loan_duration: u64,
    reward_rate: u64,
    lender_rewards_percentage: u64,
    new_super_owner: Pubkey,
    treasury_wallet: Pubkey,
) -> Result<()> {
    ctx.accounts.global_state.super_owner = new_super_owner;
    ctx.accounts.global_state.treasury_wallet = treasury_wallet;
    ctx.accounts.global_state.accrued_interest_numerator = accrued_interest_numerator;
    ctx.accounts.global_state.denominator = denominator;
    ctx.accounts.global_state.min_repaid_numerator = min_repaid_numerator;
    ctx.accounts.global_state.apr_numerator = apr_numerator;
    ctx.accounts.global_state.reward_rate = reward_rate;
    ctx.accounts.global_state.expire_loan_duration = expire_loan_duration;
    ctx.accounts.global_state.lender_rewards_percentage = lender_rewards_percentage;
    ctx.accounts.global_state.redemption_reset = 5;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdateGlobalState<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        has_one = super_owner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{constant::*, states::*, error::*, utils::*};
use std::str::FromStr;

pub fn handle(ctx: Context<WithdrawRewards>, amount: u64) -> Result<()> {
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.global_state.distribute(
        ctx.accounts.reward_vault.amount,
        current_time,
        &ctx.accounts.chainlink_program.to_account_info(),
        &ctx.accounts.sol_feed.to_account_info(),
        &ctx.accounts.usdc_feed.to_account_info(),
    )?;

    let global_bump = *ctx.bumps.get("global_state").unwrap();
    let signer_seeds = &[GLOBAL_STATE_TAG, &[global_bump]];
    let signer = &[&signer_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_reward_vault.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    let mut withraw_amount = amount;
    let withdrawable_amount = ctx
        .accounts
        .global_state
        .withdrawable_amount(ctx.accounts.reward_vault.amount)?;
    if withdrawable_amount < amount {
        withraw_amount = withdrawable_amount;
    }

    token::transfer(cpi_ctx, withraw_amount)?;

    ctx.accounts.global_state.funded_amount = ctx.accounts.global_state.funded_amount.safe_sub(withraw_amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WithdrawRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump = global_state.reward_vault_bump,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: safe. this will be checked in the distribute function
    pub chainlink_program: AccountInfo<'info>,
    /// CHECK: safe. this will be checked in the distribute function
    pub sol_feed: AccountInfo<'info>,
    /// CHECK: safe. this will be checked in the distribute function
    pub usdc_feed: AccountInfo<'info>,

    #[account(mut,
        constraint = user_reward_vault.mint == Pubkey::from_str(UNLOC_MINT).unwrap() @ LoanError::InvalidMint,
        constraint = user_reward_vault.owner == authority.key() @ LoanError::InvalidOwner,
        constraint = amount > 0 @ LoanError::InvalidAmount
    )]
    pub user_reward_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{error::*, states::*, utils::*};

pub fn fund_reward_token(ctx: Context<Fund>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_vault.to_account_info(),
        to: ctx.accounts.reward_vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

pub fn change_tokens_per_second(
    ctx: Context<ChangeTokensPerSecond>,
    token_per_second: u64,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    for pool_acc in ctx.remaining_accounts.iter() {
        let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
        loader.update(state, &ctx.accounts.clock)?;
    }
    state.token_per_second = token_per_second;
    emit!(RateChanged { token_per_second });
    Ok(())
}


pub fn change_early_unlock_fee(ctx: Context<ChangeState>, early_unlock_fee: u64) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.early_unlock_fee = early_unlock_fee;
    emit!(EarlyUnlockFeeChanged { early_unlock_fee });
    Ok(())
}

pub fn change_profile_levels(
    ctx: Context<ChangeState>,
    profile_levels: Vec<u128>,
) -> Result<()> {
    require!(
        profile_levels.len() <= MAX_PROFILE_LEVEL,
        StakingError::OverflowMaxProfileLevel
    );
    let state = &mut ctx.accounts.state;
    state.profile_levels = profile_levels;
    Ok(())
}

pub fn change_fee_vault(ctx: Context<ChangeFeeVault>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.fee_vault = ctx.accounts.fee_vault.key();
    Ok(())
}



#[derive(Accounts)]
pub struct Fund<'info> {
    #[account(
        seeds = [b"state".as_ref()], 
        bump = state.bump,
        has_one = reward_vault
    )]
    pub state: Account<'info, StateAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut,
        constraint = reward_vault.owner == state.key())]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = user_vault.owner == authority.key())]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ChangeTokensPerSecond<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ChangeState<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ChangeFeeVault<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    pub fee_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
}
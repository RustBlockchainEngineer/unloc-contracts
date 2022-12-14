use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::str::FromStr;

use crate::{error::*, utils::*, states::*};

pub fn handle(ctx: Context<Stake>, amount: u64, lock_duration: i64) -> Result<()> {
    let state = &ctx.accounts.state;
    let extra_account = &mut ctx.accounts.extra_reward_account;
    let user = &mut ctx.accounts.user;
    let pool = &mut ctx.accounts.pool;

    msg!("Lock duration: {}", lock_duration);
    extra_account.validate_lock_duration(&lock_duration)?;

    pool.update(state, &ctx.accounts.clock)?;
    let user_lock_duration = user.lock_duration;
    user.calculate_reward_amount(
        pool,
        &extra_account.get_extra_reward_percentage(&user_lock_duration),
    )?;

    user.amount = user.amount.safe_add(amount)?;
    pool.amount = pool.amount.safe_add(amount)?;

    user.lock_duration = lock_duration;
    user.calculate_reward_debt(pool)?;
    user.last_stake_time = ctx.accounts.clock.unix_timestamp;

    let cpi_accounts = Transfer {
        from: ctx.accounts.user_vault.to_account_info(),
        to: ctx.accounts.pool_vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    user.update_score_and_level(extra_account, state)?;
    emit!(UserStaked {
        pool: ctx.accounts.pool.key(),
        user: ctx.accounts.user.key(),
        authority: ctx.accounts.authority.key(),
        amount,
        lock_duration
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(
    amount: u64,
    lock_duration: i64
)]
pub struct Stake<'info> {
    #[account(mut,
        seeds = [pool.key().as_ref(), authority.key().as_ref(), user.stake_seed.to_le_bytes().as_ref()],
        bump = user.bump,
        has_one = pool @ StakingError::InvalidPool,
        has_one = authority @ StakingError::InvalidAuthority,
        constraint = lock_duration >= user.lock_duration @ StakingError::InvalidLockDuration
    )]
    pub user: Account<'info, FarmPoolUserAccount>,
    #[account(mut,
        seeds = [b"state".as_ref()],
        bump = state.bump
    )]
    pub state: Account<'info, StateAccount>,
    #[account(
        seeds = [b"extra".as_ref()],
        bump = extra_reward_account.bump
    )]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        constraint = mint.key() == pool.mint && mint.key() == Pubkey::from_str(UNLOC_MINT).unwrap() @ StakingError::InvalidMint
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut,
        constraint = pool_vault.owner == pool.key() @ StakingError::InvalidOwner
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = user_vault.owner == authority.key() @ StakingError::InvalidOwner
    )]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        address = state.fee_vault @ StakingError::InvalidVault
    )]
    pub fee_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::convert::TryInto;
use std::str::FromStr;

use crate::{error::*, utils::*, states::*};

pub fn stake(ctx: Context<Stake>, amount: u64, lock_duration: i64) -> Result<()> {
    require_keys_eq!(ctx.accounts.user_vault.owner, ctx.accounts.authority.key());
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require_keys_eq!(ctx.accounts.mint.key(), unloc_mint);

    let state = &ctx.accounts.state;
    let extra_account = &mut ctx.accounts.extra_reward_account;
    let user = &mut ctx.accounts.user;
    let pool = &mut ctx.accounts.pool;

    extra_account.validate_lock_duration(&lock_duration)?;
    require!(
        lock_duration >= user.lock_duration,
        StakingError::InvalidLockDuration
    );

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

pub fn unstake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require_keys_eq!(ctx.accounts.mint.key(), unloc_mint);

    let extra_account = &mut ctx.accounts.extra_reward_account;
    let state = &ctx.accounts.state;
    let user = &mut ctx.accounts.user;
    let pool = &mut ctx.accounts.pool;

    require!(user.amount >= amount, StakingError::UnstakeOverAmount);
    let is_early_unlock =
        user.last_stake_time.safe_add(user.lock_duration)? > ctx.accounts.clock.unix_timestamp;
    if is_early_unlock {
        // flexible reward, pay early_unlock_fee percentage, unstake the rest only
        pool.update(state, &ctx.accounts.clock)?;
        user.calculate_reward_amount(pool, &0)?;

        user.last_stake_time = ctx.accounts.clock.unix_timestamp;
        user.amount = user.amount.safe_sub(amount)?;
        pool.amount = pool.amount.safe_sub(amount)?;

        if user.amount == 0 {
            user.lock_duration = 0;
        }

        user.calculate_reward_debt(pool)?;
        drop(pool);
        let early_unlock_fee = ctx.accounts.state.early_unlock_fee;
        let early_unlock_fee_amount =
            calc_fee(amount, early_unlock_fee, ACC_PRECISION.try_into().unwrap())?;
        let unstake_amount = amount.safe_sub(early_unlock_fee_amount)?;
        let new_pool = &ctx.accounts.pool;
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.user_vault.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };

        let seeds = &[new_pool.mint.as_ref(), &[new_pool.bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, unstake_amount)?;

        emit!(UserUnstaked {
            pool: ctx.accounts.pool.key(),
            user: user.key(),
            authority: ctx.accounts.authority.key(),
            amount: unstake_amount
        });

        let cpi_accounts_fee = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.fee_vault.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program_fee = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_fee =
            CpiContext::new_with_signer(cpi_program_fee, cpi_accounts_fee, signer);
        token::transfer(cpi_ctx_fee, early_unlock_fee_amount)?;
    } else {
        pool.update(state, &ctx.accounts.clock)?;
        let user_lock_duration = user.lock_duration;
        user.calculate_reward_amount(
            pool,
            &extra_account.get_extra_reward_percentage(&user_lock_duration),
        )?;

        user.last_stake_time = ctx.accounts.clock.unix_timestamp;
        user.amount = user.amount.safe_sub(amount)?;
        pool.amount = pool.amount.safe_sub(amount)?;

        if user.amount == 0 {
            user.lock_duration = 0;
        }

        user.calculate_reward_debt(pool)?;
        drop(pool);

        let new_pool = &ctx.accounts.pool;
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.user_vault.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };

        let seeds = &[new_pool.mint.as_ref(), &[new_pool.bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;
        emit!(UserUnstaked {
            pool: ctx.accounts.pool.key(),
            user: user.key(),
            authority: ctx.accounts.authority.key(),
            amount
        });
    }
    user.update_score_and_level(extra_account, state)?;

    Ok(())
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut,
        seeds = [pool.key().as_ref(), authority.key().as_ref()], bump = user.bump, has_one = pool, has_one = authority)]
    pub user: Account<'info, FarmPoolUserAccount>,
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(
        seeds = [b"extra".as_ref()], bump = extra_reward_account.bump)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = mint.key() == pool.mint)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut,
        constraint = pool_vault.owner == pool.key())]
    pub pool_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = fee_vault.key() == state.fee_vault)]
    pub fee_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
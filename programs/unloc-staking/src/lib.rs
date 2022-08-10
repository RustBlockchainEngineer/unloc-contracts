use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::convert::TryInto;
use std::mem::size_of;

pub mod error;
pub mod utils;
pub mod states;
pub mod processor;

use crate::{utils::*, states::*, processor::*};

declare_id!("GMdNWaWuQQAMTFr1gWd5VeT6CLbwn6QwiTy3Ek8F6Xvr");

#[program]
pub mod unloc_staking {
    use super::*;

    pub fn create_state(
        ctx: Context<CreateState>,
        token_per_second: u64,
        early_unlock_fee: u64,
        profile_levels: Vec<u128>,
    ) -> Result<()> {
        set_stake_state::create_state(
            ctx,
            token_per_second,
            early_unlock_fee,
            profile_levels
        )
    }

    pub fn create_extra_reward_configs(
        ctx: Context<CreateExtraRewardsConfigs>,
        configs: Vec<DurationExtraRewardConfig>,
    ) -> Result<()> {
        set_stake_state::create_extra_reward_configs(ctx, configs)
    }

    pub fn set_extra_reward_configs(
        ctx: Context<SetExtraRewardsConfigs>,
        configs: Vec<DurationExtraRewardConfig>,
    ) -> Result <()> {
        set_stake_state::set_extra_reward_configs(ctx, configs)
    }

    pub fn fund_reward_token(
        ctx: Context<Fund>,
        amount: u64
    ) -> Result<()> {
        update_stake_state::fund_reward_token(ctx, amount)
    }

    pub fn change_tokens_per_second(
        ctx: Context<ChangeTokensPerSecond>,
        token_per_second: u64,
    ) -> Result<()> {
        update_stake_state::change_tokens_per_second(ctx, token_per_second)
    }

    pub fn change_early_unlock_fee(
        ctx: Context<ChangeState>,
        early_unlock_fee: u64
    ) -> Result<()> {
        update_stake_state::change_early_unlock_fee(ctx, early_unlock_fee)
    }

    pub fn change_profile_levels(
        ctx: Context<ChangeState>,
        profile_levels: Vec<u128>,
    ) -> Result<()> {
        update_stake_state::change_profile_levels(ctx, profile_levels)
    }

    pub fn change_fee_vault(
        ctx: Context<ChangeFeeVault>
    ) -> Result<()> {
        update_stake_state::change_fee_vault(ctx)
    }

    pub fn create_pool(
        ctx: Context<CreateFarmPool>,
        point: u64,
        amount_multipler: u64
    ) -> Result<()> {
        pool::create_pool(ctx, point, amount_multipler)
    }

    pub fn close_pool(
        ctx: Context<CloseFarmPool>
    ) -> Result<()> {
        pool::close_pool(ctx)
    }

    pub fn change_pool_amount_multipler(
        ctx: Context<ChangePoolSetting>,
        amount_multipler: u64
    ) -> Result<()> {
        pool::change_pool_amount_multipler(ctx, amount_multipler)
    }

    pub fn change_pool_point(
        ctx: Context<ChangePoolSetting>,
        point: u64
    ) -> Result<()> {
        pool::change_pool_point(ctx, point)
    }

    // Where should this instruction go?
    pub fn create_user(ctx: Context<CreatePoolUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.authority = ctx.accounts.authority.key();
        user.bump = *ctx.bumps.get("user").unwrap();
        user.pool = ctx.accounts.pool.key();

        let pool = &mut ctx.accounts.pool;
        pool.total_user = pool.total_user.safe_add(1)?;
        emit!(UserCreated {
            pool: ctx.accounts.pool.key(),
            user: ctx.accounts.user.key(),
            authority: ctx.accounts.authority.key(),
        });
        Ok(())
    }

    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_duration: i64
    ) -> Result<()> {
        process_stake::stake(ctx, amount, lock_duration)
    }

    pub fn unstake(
        ctx: Context<Stake>,
        amount: u64
    ) -> Result<()> {
        process_stake::unstake(ctx, amount)
    }

    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {
        let extra_account = &mut ctx.accounts.extra_reward_account;
        let state = &ctx.accounts.state;
        let pool = &mut ctx.accounts.pool;
        let user = &mut ctx.accounts.user;

        pool.update(state, &ctx.accounts.clock)?;
        let user_lock_duration = user.lock_duration;
        user.calculate_reward_amount(
            pool,
            &extra_account.get_extra_reward_percentage(&user_lock_duration),
        )?;

        let total_reward = user
            .reward_amount
            .safe_add(user.extra_reward)?
            .try_into()
            .unwrap();

        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_vault.to_account_info(),
            authority: ctx.accounts.state.to_account_info(),
        };

        let seeds = &[b"state".as_ref(), &[state.bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, total_reward)?;

        user.reward_amount = 0;
        user.extra_reward = 0;
        user.calculate_reward_debt(pool)?;
        emit!(UserHarvested {
            pool: ctx.accounts.pool.key(),
            user: ctx.accounts.user.key(),
            authority: ctx.accounts.authority.key(),
            amount: total_reward
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct CreatePoolUser<'info> {
    // this user account will be remained forever. we don't delete these accounts for permanent history
    #[account(
        init,
        seeds = [pool.key().as_ref(), authority.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<FarmPoolUserAccount>()
    )]
    pub user: Account<'info, FarmPoolUserAccount>,
    #[account(
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Harvest<'info> {
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
        constraint = reward_vault.owner == state.key())]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = user_vault.owner == authority.key())]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::convert::TryFrom;
use std::convert::TryInto;
use std::mem::size_of;
use std::str::FromStr;

pub mod error;
pub mod utils;

use crate::{error::*, utils::*};

declare_id!("EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU");

const DEVNET_MODE: bool = true;

pub const INITIAL_OWNER: &str = "atPFsAVbFFpgtdDoXMyVnp3696PZVfJ3MGQp6CiuZfW";
const FULL_100: u64 = 100_000_000_000;
const ACC_PRECISION: u128 = 100_000_000_000;
const MAX_LEVEL: usize = 10;
const MAX_PROFILE_LEVEL: usize = 5;
pub const UNLOC_MINT: &str = if DEVNET_MODE {
    "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
} else {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
#[program]
pub mod unloc_staking {
    use super::*;

    pub fn create_state(
        ctx: Context<CreateState>,
        token_per_second: u64,
        early_unlock_fee: u64,
        profile_levels: Vec<u128>,
    ) -> Result<()> {
        let initial_owner = Pubkey::from_str(INITIAL_OWNER).unwrap();
        require_keys_eq!(initial_owner, ctx.accounts.authority.key());

        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();

        require_keys_eq!(ctx.accounts.reward_mint.key(), unloc_mint);
        require_keys_eq!(ctx.accounts.reward_vault.mint, unloc_mint);
        require!(
            profile_levels.len() <= MAX_PROFILE_LEVEL,
            StakingError::OverflowMaxProfileLevel
        );
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.bump = *ctx.bumps.get("state").unwrap();
        state.start_time = ctx.accounts.clock.unix_timestamp;
        state.token_per_second = token_per_second;
        state.early_unlock_fee = early_unlock_fee;
        state.reward_mint = ctx.accounts.reward_mint.key();
        state.reward_vault = ctx.accounts.reward_vault.key();
        state.fee_vault = ctx.accounts.fee_vault.key();
        state.profile_levels = profile_levels;
        Ok(())
    }

    pub fn create_extra_reward_configs(
        ctx: Context<CreateExtraRewardsConfigs>,
        configs: Vec<DurationExtraRewardConfig>,
    ) -> Result<()> {
        let extra_account = &mut ctx.accounts.extra_reward_account;
        extra_account.authority = ctx.accounts.authority.key();
        extra_account.bump = *ctx.bumps.get("extra_reward_account").unwrap();
        extra_account.configs = configs;
        extra_account.validate()?;
        Ok(())
    }

    pub fn set_extra_reward_configs(
        ctx: Context<SetExtraRewardsConfigs>,
        configs: Vec<DurationExtraRewardConfig>,
    ) -> Result<()> {
        let extra_account = &mut ctx.accounts.extra_reward_account;
        extra_account.configs = configs;
        extra_account.validate()?;
        Ok(())
    }

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

    pub fn create_pool(
        ctx: Context<CreateFarmPool>,
        point: u64,
        amount_multipler: u64,
    ) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();

        require_keys_eq!(ctx.accounts.mint.key(), unloc_mint);

        require_keys_eq!(ctx.accounts.vault.mint, unloc_mint);

        let state = &mut ctx.accounts.state;
        for pool_acc in ctx.remaining_accounts.iter() {
            let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
            loader.update(state, &ctx.accounts.clock)?;
        }

        let pool = &mut ctx.accounts.pool;
        pool.bump = *ctx.bumps.get("pool").unwrap();
        pool.mint = ctx.accounts.mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.point = point;
        pool.amount_multipler = amount_multipler;
        pool.authority = ctx.accounts.authority.key();

        state.total_point = state.total_point.safe_add(point)?;

        emit!(PoolCreated {
            pool: ctx.accounts.pool.key(),
            mint: ctx.accounts.mint.key()
        });
        Ok(())
    }

    pub fn close_pool(ctx: Context<CloseFarmPool>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        for pool_acc in ctx.remaining_accounts.iter() {
            let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
            loader.update(state, &ctx.accounts.clock)?;
        }
        let pool = &ctx.accounts.pool;
        require_eq!(pool.amount, 0);
        state.total_point = state.total_point.safe_sub(pool.point)?;
        Ok(())
    }

    pub fn change_pool_amount_multipler(
        ctx: Context<ChangePoolSetting>,
        amount_multipler: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.amount_multipler = amount_multipler;
        emit!(PoolAmountMultiplerChanged {
            pool: ctx.accounts.pool.key(),
            amount_multipler
        });
        Ok(())
    }

    pub fn change_pool_point(ctx: Context<ChangePoolSetting>, point: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        for pool_acc in ctx.remaining_accounts.iter() {
            let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
            loader.update(state, &ctx.accounts.clock)?;
        }
        let pool = &mut ctx.accounts.pool;
        state.total_point = state.total_point.safe_sub(pool.point)?.safe_add(point)?;
        pool.point = point;
        emit!(PoolPointChanged {
            pool: ctx.accounts.pool.key(),
            point
        });
        Ok(())
    }

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
pub struct CreateState<'info> {
    #[account(
        init,
        seeds = [b"state".as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<StateAccount>() + 16 * MAX_PROFILE_LEVEL
    )]
    pub state: Account<'info, StateAccount>,
    #[account(constraint = reward_vault.owner == state.key())]
    pub reward_vault: Account<'info, TokenAccount>,
    pub reward_mint: Box<Account<'info, Mint>>,
    pub fee_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
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

#[derive(Accounts)]
#[instruction()]
pub struct CreateFarmPool<'info> {
    #[account(
        init,
        seeds = [mint.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<FarmPoolAccount>()
    )]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    pub mint: Box<Account<'info, Mint>>,
    #[account(constraint = vault.owner == pool.key())]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CloseFarmPool<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump, has_one = authority, close = authority)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ChangePoolSetting<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump, has_one = authority)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()],
        bump = state.bump,
        has_one = authority
    )]
    pub state: Account<'info, StateAccount>,
    #[account(init,
        seeds = [b"extra".as_ref()], bump, payer = authority, space = 8 + 37 + MAX_LEVEL * 16)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"extra".as_ref()], bump = extra_reward_account.bump, has_one = authority)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
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

#[account]
#[derive(Default)]
pub struct StateAccount {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_vault: Pubkey,
    pub fee_vault: Pubkey,
    pub bump: u8,
    pub total_point: u64,
    pub start_time: i64,
    pub token_per_second: u64,
    pub early_unlock_fee: u64,
    pub profile_levels: Vec<u128>,
}
impl StateAccount {
    fn get_profile_level<'info>(&self, score: u128) -> u64 {
        let profile_levels: Vec<u128> = self.profile_levels.iter().rev().cloned().collect();
        let mut i = 0;
        for level in profile_levels.iter() {
            if score >= *level {
                return (profile_levels.len() - i).try_into().unwrap();
            }
            i = i + 1;
        }
        return 0;
    }
}
#[account]
#[derive(Default)]
pub struct ExtraRewardsAccount {
    pub bump: u8,
    pub authority: Pubkey,
    pub configs: Vec<DurationExtraRewardConfig>,
} // 37 + 10 * 16

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Copy)]
pub struct DurationExtraRewardConfig {
    duration: i64,
    extra_percentage: u64, // decimals 9, MAX = 100_000_000_000
}

impl ExtraRewardsAccount {
    fn validate<'info>(&mut self) -> Result<()> {
        if self.configs.len() > 1 {
            let mut duration = 0;
            let mut extra_percentage = 0;
            for config in self.configs.iter() {
                require!(config.duration >= duration, StakingError::InvalidSEQ);
                require!(
                    config.extra_percentage >= extra_percentage,
                    StakingError::InvalidSEQ
                );
                duration = config.duration;
                extra_percentage = config.extra_percentage;
            }
        }
        Ok(())
    }
    fn validate_lock_duration<'info>(&mut self, lock_duration: &i64) -> Result<()> {
        for config in self.configs.iter() {
            if config.duration == *lock_duration {
                return Ok(());
            }
        }
        Err(StakingError::InvalidLockDuration.into())
    }
    fn get_extra_reward_percentage<'info>(&self, lock_duration: &i64) -> u64 {
        let reversed_configs: Vec<DurationExtraRewardConfig> =
            self.configs.iter().rev().cloned().collect();
        for tier in reversed_configs.iter() {
            if *lock_duration >= tier.duration {
                return tier.extra_percentage;
            }
        }
        return 0;
    }
}

#[account]
#[derive(Default)]
pub struct FarmPoolAccount {
    pub bump: u8,
    pub authority: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub point: u64,
    pub last_reward_time: i64,
    pub acc_reward_per_share: u128,
    pub amount_multipler: u64,
    pub total_user: u64,
}

impl FarmPoolAccount {
    fn update<'info>(&mut self, state: &StateAccount, clock: &Sysvar<'info, Clock>) -> Result<()> {
        let seconds =
            u128::try_from(clock.unix_timestamp.safe_sub(self.last_reward_time)?).unwrap();
        let mut reward_per_share: u128 = 0;
        if self.amount > 0 && seconds > 0 && self.point > 0 {
            reward_per_share = u128::from(state.token_per_second)
                .safe_mul(seconds)?
                .safe_mul(u128::from(self.point))?
                .safe_mul(ACC_PRECISION)?
                .safe_div(u128::from(state.total_point))?
                .safe_div(u128::from(self.amount))?;
        }
        self.acc_reward_per_share = self.acc_reward_per_share.safe_add(reward_per_share)?;
        self.last_reward_time = clock.unix_timestamp;

        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct FarmPoolUserAccount {
    pub bump: u8,
    pub pool: Pubkey,
    pub authority: Pubkey,
    pub amount: u64,
    pub reward_amount: u128,
    pub extra_reward: u128, // extra from lock duration; ex lock 12M => +10%
    pub reward_debt: u128,
    pub last_stake_time: i64,
    pub lock_duration: i64,
    pub unloc_score: u128,
    pub profile_level: u64,
    pub reserved_1: u128,
    pub reserved_2: u128,
    pub reserved_3: u128,
}

impl FarmPoolUserAccount {
    fn calculate_reward_amount<'info>(
        &mut self,
        pool: &FarmPoolAccount,
        extra_percentage: &u64,
    ) -> Result<()> {
        let pending_amount: u128 = u128::from(self.amount)
            .safe_mul(pool.acc_reward_per_share)?
            .safe_div(ACC_PRECISION)?
            .safe_sub(u128::from(self.reward_debt))?;
        self.reward_amount = self.reward_amount.safe_add(pending_amount)?;
        let extra_amount: u128 = u128::from(pending_amount)
            .safe_mul(u128::from(*extra_percentage))?
            .safe_div(u128::from(FULL_100))?;
        self.extra_reward = self.extra_reward.safe_add(extra_amount)?;
        Ok(())
    }
    fn calculate_reward_debt<'info>(&mut self, pool: &FarmPoolAccount) -> Result<()> {
        msg!("amount {}", self.amount);
        msg!("acc_per_share {}", pool.acc_reward_per_share);
        msg!(
            "multiplied {}",
            u128::from(self.amount).safe_mul(pool.acc_reward_per_share)?
        );
        msg!(
            "scaled {}",
            u128::from(self.amount)
                .safe_mul(pool.acc_reward_per_share)?
                .safe_div(ACC_PRECISION)?
        );

        self.reward_debt = u128::from(self.amount)
            .safe_mul(pool.acc_reward_per_share)?
            .safe_div(ACC_PRECISION)?;
        Ok(())
    }
    fn get_score<'info>(&mut self, extra_percentage: &u64) -> Result<u128> {
        let score: u128 = u128::from(self.amount)
            .safe_mul(u128::from(*extra_percentage))?
            .safe_div(u128::from(FULL_100))?
            .safe_mul(100u128)?;
        Ok(score)
    }
    fn update_score_and_level<'info>(
        &mut self,
        extra_rewards_account: &ExtraRewardsAccount,
        state: &StateAccount,
    ) -> Result<()> {
        let extra_percentage =
            extra_rewards_account.get_extra_reward_percentage(&self.lock_duration);
        let score = self.get_score(&extra_percentage)?;
        let profile_level = state.get_profile_level(score);
        self.unloc_score = score;
        self.profile_level = profile_level;
        Ok(())
    }
}

#[event]
pub struct RateChanged {
    token_per_second: u64,
}

#[event]
pub struct EarlyUnlockFeeChanged {
    early_unlock_fee: u64,
}
#[event]
pub struct PoolCreated {
    pool: Pubkey,
    mint: Pubkey,
}
#[event]
pub struct PoolLockDurationChanged {
    pool: Pubkey,
    lock_duration: i64,
}
#[event]
pub struct PoolAmountMultiplerChanged {
    pool: Pubkey,
    amount_multipler: u64,
}
#[event]
pub struct PoolPointChanged {
    pool: Pubkey,
    point: u64,
}
#[event]
pub struct UserCreated {
    pool: Pubkey,
    user: Pubkey,
    authority: Pubkey,
}
#[event]
pub struct UserStaked {
    pool: Pubkey,
    user: Pubkey,
    authority: Pubkey,
    amount: u64,
    lock_duration: i64,
}
#[event]
pub struct UserUnstaked {
    pool: Pubkey,
    user: Pubkey,
    authority: Pubkey,
    amount: u64,
}
#[event]
pub struct UserHarvested {
    pool: Pubkey,
    user: Pubkey,
    authority: Pubkey,
    amount: u64,
}
pub fn calc_fee(total: u64, fee_percent: u64, denominator: u64) -> Result<u64> {
    let _total: u128 = total as u128;
    let _fee_percent: u128 = fee_percent as u128;
    let _denominator: u128 = denominator as u128;

    if _denominator == 0 {
        return Err(error!(StakingError::InvalidDenominator));
    }
    let result = _total.safe_mul(_fee_percent)?.safe_div(_denominator)?;
    Ok(result.try_into().unwrap())
}

use anchor_lang::prelude::*;

pub mod error;
pub mod utils;
pub mod states;
pub mod processor;

use crate::{states::*, processor::*};

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
        process_set_stake_state::create_state(
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
        process_set_stake_state::create_extra_reward_configs(ctx, configs)
    }

    pub fn set_extra_reward_configs(
        ctx: Context<SetExtraRewardsConfigs>,
        configs: Vec<DurationExtraRewardConfig>,
    ) -> Result <()> {
        process_set_stake_state::set_extra_reward_configs(ctx, configs)
    }

    pub fn fund_reward_token(
        ctx: Context<Fund>,
        amount: u64
    ) -> Result<()> {
        process_update_stake_state::fund_reward_token(ctx, amount)
    }

    pub fn change_tokens_per_second(
        ctx: Context<ChangeTokensPerSecond>,
        token_per_second: u64,
    ) -> Result<()> {
        process_update_stake_state::change_tokens_per_second(ctx, token_per_second)
    }

    pub fn change_early_unlock_fee(
        ctx: Context<ChangeState>,
        early_unlock_fee: u64
    ) -> Result<()> {
        process_update_stake_state::change_early_unlock_fee(ctx, early_unlock_fee)
    }

    pub fn change_profile_levels(
        ctx: Context<ChangeState>,
        profile_levels: Vec<u128>,
    ) -> Result<()> {
        process_update_stake_state::change_profile_levels(ctx, profile_levels)
    }

    pub fn change_fee_vault(
        ctx: Context<ChangeFeeVault>
    ) -> Result<()> {
        process_update_stake_state::change_fee_vault(ctx)
    }

    pub fn create_pool(
        ctx: Context<CreateFarmPool>,
        point: u64,
        amount_multipler: u64
    ) -> Result<()> {
        process_pool::create_pool(ctx, point, amount_multipler)
    }

    pub fn close_pool(
        ctx: Context<CloseFarmPool>
    ) -> Result<()> {
        process_pool::close_pool(ctx)
    }

    pub fn change_pool_amount_multipler(
        ctx: Context<ChangePoolSetting>,
        amount_multipler: u64
    ) -> Result<()> {
        process_pool::change_pool_amount_multipler(ctx, amount_multipler)
    }

    pub fn change_pool_point(
        ctx: Context<ChangePoolSetting>,
        point: u64
    ) -> Result<()> {
        process_pool::change_pool_point(ctx, point)
    }

    pub fn create_user(
        ctx: Context<CreatePoolUser>
    ) -> Result<()> {
        process_create_user::create_user(ctx)
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

    pub fn harvest(
        ctx: Context<Harvest>
    ) -> Result<()> {
        process_harvest::harvest(ctx)
    }
}
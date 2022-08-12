use anchor_lang::prelude::*;
use std::convert::TryFrom;
use std::convert::TryInto;
use crate::{error::*, utils::*, constant::*};

// const ACC_PRECISION: u128 = 100_000_000_000;
// const FULL_100: u64 = 100_000_000_000;

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
    pub fn get_profile_level<'info>(&self, score: u128) -> u64 {
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
    pub fn validate<'info>(&mut self) -> Result<()> {
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
    pub fn validate_lock_duration<'info>(&mut self, lock_duration: &i64) -> Result<()> {
        for config in self.configs.iter() {
            if config.duration == *lock_duration {
                return Ok(());
            }
        }
        Err(StakingError::InvalidLockDuration.into())
    }
    pub fn get_extra_reward_percentage<'info>(&self, lock_duration: &i64) -> u64 {
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
    pub fn update<'info>(&mut self, state: &StateAccount, clock: &Sysvar<'info, Clock>) -> Result<()> {
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
    pub fn calculate_reward_amount<'info>(
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
    pub fn calculate_reward_debt<'info>(&mut self, pool: &FarmPoolAccount) -> Result<()> {
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
    pub fn get_score<'info>(&mut self, extra_percentage: &u64) -> Result<u128> {
        let score: u128 = u128::from(self.amount)
            .safe_mul(u128::from(*extra_percentage))?
            .safe_div(u128::from(FULL_100))?
            .safe_mul(100u128)?;
        Ok(score)
    }
    pub fn update_score_and_level<'info>(
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
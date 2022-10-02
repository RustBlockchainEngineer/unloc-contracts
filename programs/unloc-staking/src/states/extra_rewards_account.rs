use anchor_lang::prelude::*;
use crate::{error::*};


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
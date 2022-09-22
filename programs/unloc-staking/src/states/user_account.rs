use anchor_lang::prelude::*;
use crate::{utils::*, farmpool_account::*, extra_rewards_account::*, state_account::*};

#[account]
#[derive(Default)]
pub struct FarmPoolUserAccount {
    pub bump: u8,
    pub stake_seed: u8,
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
use anchor_lang::prelude::*;
use std::convert::TryFrom;
use crate::{utils::*, state_account::*};

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
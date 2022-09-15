use anchor_lang::prelude::*;
use std::convert::TryInto;

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
    pub stake_acct_seeds: [u8; 20],
    pub liquidity_mining_stake_seed: u8,
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
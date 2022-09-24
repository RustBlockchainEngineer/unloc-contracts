use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserStateAccount {
    pub total_unloc_score: u128,
    pub stake_acct_seeds: Vec<u8>, // [u8; 20],
    pub authority: Pubkey,
}
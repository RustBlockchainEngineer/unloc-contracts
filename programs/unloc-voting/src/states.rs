use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub super_owner: Pubkey,
    pub staking_pid: Pubkey,
    pub voting_count: u64
}

#[account]
#[derive(Default)]
pub struct Voting {
    pub voting_number: u64,
    pub voting_start_timestamp: u64,
    pub voting_end_timestamp: u64,
    pub total_score: u128,
    pub total_items: u64,
}

#[account]
#[derive(Default)]
pub struct VotingItem {
    pub key: Pubkey,
    pub voting: Pubkey,
    pub voting_score: u128,
}
#[account]
#[derive(Default)]
pub struct VotingUser {
    pub owner: Pubkey,
    pub voting: Pubkey,
    pub voting_item: Pubkey,
    pub voting_score: u128,
}

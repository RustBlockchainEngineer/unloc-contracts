use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub bump: u8,
    pub super_owner: Pubkey,
    pub voting_count: u64,
}

#[account]
#[derive(Default)]
pub struct Voting {
    pub bump: u8,
    pub voting_number: u64,
    pub voting_start_timestamp: u64,
    pub voting_end_timestamp: u64,
    pub total_score: u128,
    pub total_items: u64,
}

#[account]
#[derive(Default)]
pub struct VotingItem {
    pub bump: u8,
    pub key: Pubkey,
    pub voting: Pubkey,
    pub voting_score: u128,
}
#[account]
#[derive(Default)]
pub struct VotingUser {
    pub bump: u8,
    pub owner: Pubkey,
    pub voting: Pubkey,
    pub voting_item: Pubkey,
    pub voting_score: u128,
}

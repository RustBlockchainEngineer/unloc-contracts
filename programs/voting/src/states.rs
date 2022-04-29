use anchor_lang::prelude::*;
use mpl_token_metadata::{
    state::Collection
};

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub super_owner: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Voting {
    pub collection_key: Pubkey,
    pub voting_start_timestamp: u64,
    pub voting_end_timestamp: u64,
    pub total_score: u64,
    pub total_items: u64,
}

#[account]
#[derive(Default)]
pub struct VotingItem {
    pub key: Pubkey,
    pub voting: Pubkey,
    pub voting_score: u64,
}
#[account]
#[derive(Default)]
pub struct VotingUser {
    pub owner: Pubkey,
    pub voting: Pubkey,
    pub voting_item: Pubkey,
    pub voting_score: u64,
}
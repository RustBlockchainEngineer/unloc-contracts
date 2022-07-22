use anchor_lang::prelude::*;

/// constant
pub mod constant;
/// error
pub mod error;
/// events
pub mod events;
///processor
pub mod processor;
/// states
pub mod states;
/// events
pub mod utils;

use crate::processor::*;

declare_id!("6z6RuFauTG511XRakJnPhxUTCVPohv6oC69xieMdm4Z9");

#[program]
pub mod unloc_voting {
    use super::*;

    pub fn set_global_state(ctx: Context<SetGlobalState>, new_super_owner: Pubkey) -> Result<()> {
        process_set_global_state(ctx, new_super_owner)
    }
    pub fn set_voting(
        ctx: Context<SetVoting>,
        voting_number: u64,
        voting_start_timestamp: u64,
        voting_end_timestamp: u64,
    ) -> Result<()> {
        process_set_voting(
            ctx,
            voting_number,
            voting_start_timestamp,
            voting_end_timestamp,
        )
    }
    pub fn set_voting_item(ctx: Context<SetVotingItem>, key: Pubkey) -> Result<()> {
        process_set_voting_item(ctx, key)
    }
    pub fn vote(ctx: Context<Vote>) -> Result<()> {
        process_vote(ctx)
    }
    pub fn del_voting_item(ctx: Context<DelVotingItem>) -> Result<()> {
        process_del_voting_item(ctx)
    }
}

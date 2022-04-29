use anchor_lang::prelude::*;

/// states
pub mod states;
///processor
pub mod processor;
/// error
pub mod error;
/// constant
pub mod constant;
/// events
pub mod events;
/// events
pub mod utils;

use crate::{
    processor::*,
};

declare_id!("3LhSA4Tdx5o17UTwynCMZJ8XERsU2nh5P3UwmTDSuGQ7");

#[program]
pub mod voting {
    use super::*;
    
    pub fn set_global_state(ctx: Context<SetGlobalState>, new_super_owner: Pubkey) -> Result<()> { 
        process_set_global_state(ctx, new_super_owner)
    }
    pub fn set_voting(ctx: Context<SetVoting>) -> Result<()> { 
        process_set_voting(ctx)
    }
    pub fn set_voting_item(ctx: Context<SetVotingItem>) -> Result<()> { 
        process_set_voting_item(ctx)
    }
    pub fn vote(ctx: Context<Vote>) -> Result<()> { 
        process_vote(ctx)
    }
    pub fn del_voting(ctx: Context<DelVoting>) -> Result<()> { 
        process_del_voting(ctx)
    }
    pub fn del_voting_item(ctx: Context<DelVotingItem>) -> Result<()> { 
        process_del_voting_item(ctx)
    }
}
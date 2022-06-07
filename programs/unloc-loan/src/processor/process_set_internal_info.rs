use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
    utils::*,
};

pub fn process_set_internal_info(
    ctx: Context<SetInternalInfo>, 
    unloc_staking_pid: Pubkey,
    unloc_staking_pool_id: Pubkey,
    voting_pid: Pubkey,
    token_metadata_pid: Pubkey,
    current_voting_num: u64,
) -> Result<()> {
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.unloc_staking_pid = unloc_staking_pid;
    ctx.accounts.global_state.unloc_staking_pool_id = unloc_staking_pool_id;
    ctx.accounts.global_state.voting_pid = voting_pid;
    ctx.accounts.global_state.current_voting_num = current_voting_num;
    ctx.accounts.global_state.token_metadata_pid = token_metadata_pid;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetInternalInfo <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
}

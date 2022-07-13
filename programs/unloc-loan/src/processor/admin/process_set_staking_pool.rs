use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
    utils::*,
};

pub fn handle(
    ctx: Context<SetStakingPool>, 
    unloc_staking_pid: Pubkey,
    unloc_staking_pool_id: Pubkey,
) -> Result<()> {
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.unloc_staking_pid = unloc_staking_pid;
    ctx.accounts.global_state.unloc_staking_pool_id = unloc_staking_pool_id;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetStakingPool <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
}

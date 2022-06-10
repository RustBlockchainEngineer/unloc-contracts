use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
    utils::*,
};

pub fn handle(
    ctx: Context<SetVoting>, 
    voting_pid: Pubkey,
    voting: Pubkey,
) -> Result<()> {
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.voting_pid = voting_pid;
    ctx.accounts.global_state.voting = voting;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetVoting <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;

pub fn process_set_global_state(
    ctx: Context<SetGlobalState>, 
    new_super_owner: Pubkey, 
    staking_pid: Pubkey, 
) -> Result<()> {
    if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
        ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
        ctx.accounts.global_state.voting_count = 0;
    }
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.super_owner = new_super_owner;
    ctx.accounts.global_state.staking_pid = staking_pid;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetGlobalState <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = super_owner,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

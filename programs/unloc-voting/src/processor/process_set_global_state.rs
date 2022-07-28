use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;
pub fn process_set_global_state(
    ctx: Context<SetGlobalState>, 
    new_super_owner: Pubkey,
) -> Result<()> {
    if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
        let initial_owner = Pubkey::from_str(INITIAL_OWNER).unwrap();
        require_keys_eq!(initial_owner, ctx.accounts.super_owner.key());
        ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
        ctx.accounts.global_state.voting_count = 0;
        ctx.accounts.global_state.bump = *ctx.bumps.get("global_state").unwrap();
    }
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.super_owner = new_super_owner;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetGlobalState <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = payer,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

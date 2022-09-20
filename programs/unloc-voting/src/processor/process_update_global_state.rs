use crate::{constant::*, states::*};
use anchor_lang::prelude::*;
pub fn process_update_global_state(
    ctx: Context<UpdateGlobalState>,
    new_super_owner: Pubkey,
) -> Result<()> {
    ctx.accounts.global_state.super_owner = new_super_owner;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct UpdateGlobalState<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}

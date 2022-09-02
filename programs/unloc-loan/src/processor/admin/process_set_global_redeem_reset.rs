use crate::{constant::*, states::*, utils::*};
use anchor_lang::prelude::*;

pub fn handle(ctx: Context<SetRedeemReset>, new_redeem_reset: i64) -> Result<()> {
    assert_owner(
        ctx.accounts.global_state.super_owner,
        ctx.accounts.super_owner.key(),
    )?;

    ctx.accounts.global_state.redemption_reset = new_redeem_reset;
    msg!("New redemption time: {}", ctx.accounts.global_state.redemption_reset);

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetRedeemReset<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}
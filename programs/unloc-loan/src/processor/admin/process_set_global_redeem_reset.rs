use crate::{constant::*, states::*};
use anchor_lang::prelude::*;

pub fn handle(ctx: Context<SetRedeemReset>, new_redeem_reset: i64) -> Result<()> {

    ctx.accounts.global_state.redemption_reset = new_redeem_reset;
    msg!("new redemption time: {}", ctx.accounts.global_state.redemption_reset);

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
        has_one = super_owner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}
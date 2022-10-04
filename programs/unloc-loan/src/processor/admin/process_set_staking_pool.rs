use crate::{constant::*, states::*, error::*};
use anchor_lang::prelude::*;

pub fn handle(ctx: Context<SetStakingPool>, unloc_staking_pool_id: Pubkey) -> Result<()> {
    ctx.accounts.global_state.unloc_staking_pool_id = unloc_staking_pool_id;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetStakingPool<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner @ LoanError::InvalidOwner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
}

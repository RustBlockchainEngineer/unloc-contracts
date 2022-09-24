use anchor_lang::prelude::*;
use std::mem::size_of;

use crate::{states::*};

pub fn handle(ctx: Context<CreateUserState>) -> Result<()> {
    ctx.accounts.user_state.total_unloc_score = 0;
    ctx.accounts.user_state.authority = ctx.accounts.authority.key();
    msg!("User state account has been initialized");
    Ok(())
}

#[derive(Accounts)]
pub struct CreateUserState <'info> {
    #[account(
        init,
        seeds = [pool.key().as_ref(), authority.key.as_ref()],
        bump,
        payer = payer,
        space =  8 + size_of::<UserStateAccount>()
    )]
    pub user_state: Account<'info, UserStateAccount>,
    #[account(mut, seeds = [pool.mint.key().as_ref()], bump = pool.bump)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use std::mem::size_of;

use crate::{utils::*, states::*};

pub fn handle(ctx: Context<CreatePoolUser>, stake_seed: u8) -> Result<()> {
    let user = &mut ctx.accounts.user;
    user.authority = ctx.accounts.authority.key();
    user.bump = *ctx.bumps.get("user").unwrap();
    user.pool = ctx.accounts.pool.key();

    ctx.accounts.state.validate_stake_acct_seed(&stake_seed)?;

    user.stake_seed = stake_seed;
    msg!("User stake seed: {}", user.stake_seed);

    let pool = &mut ctx.accounts.pool;
    pool.total_user = pool.total_user.safe_add(1)?;
    emit!(UserCreated {
        pool: ctx.accounts.pool.key(),
        user: ctx.accounts.user.key(),
        authority: ctx.accounts.authority.key(),
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(stake_seed: u8)]
pub struct CreatePoolUser<'info> {
    // this user account will be remained forever. we don't delete these accounts for permanent history
    #[account(
        init,
        seeds = [pool.key().as_ref(), authority.key().as_ref(), stake_seed.to_le_bytes().as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<FarmPoolUserAccount>()
    )]
    pub user: Account<'info, FarmPoolUserAccount>,
    #[account(
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}
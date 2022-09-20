use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use std::mem::size_of;
use std::str::FromStr;

use crate::{utils::*, states::*};

pub fn create_pool(
    ctx: Context<CreateFarmPool>,
    point: u64,
    amount_multipler: u64,
) -> Result<()> {
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();

    require_keys_eq!(ctx.accounts.mint.key(), unloc_mint);

    require_keys_eq!(ctx.accounts.vault.mint, unloc_mint);

    let state = &mut ctx.accounts.state;
    for pool_acc in ctx.remaining_accounts.iter() {
        let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
        loader.update(state, &ctx.accounts.clock)?;
    }

    let pool = &mut ctx.accounts.pool;
    pool.bump = *ctx.bumps.get("pool").unwrap();
    pool.mint = ctx.accounts.mint.key();
    pool.vault = ctx.accounts.vault.key();
    pool.point = point;
    pool.amount_multipler = amount_multipler;
    pool.authority = ctx.accounts.authority.key();

    state.total_point = state.total_point.safe_add(point)?;

    emit!(PoolCreated {
        pool: ctx.accounts.pool.key(),
        mint: ctx.accounts.mint.key()
    });
    Ok(())
}

pub fn close_pool(ctx: Context<CloseFarmPool>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    for pool_acc in ctx.remaining_accounts.iter() {
        let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
        loader.update(state, &ctx.accounts.clock)?;
    }
    let pool = &ctx.accounts.pool;
    require_eq!(pool.amount, 0);
    state.total_point = state.total_point.safe_sub(pool.point)?;
    Ok(())
}

pub fn change_pool_amount_multipler(
    ctx: Context<ChangePoolSetting>,
    amount_multipler: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.amount_multipler = amount_multipler;
    emit!(PoolAmountMultiplerChanged {
        pool: ctx.accounts.pool.key(),
        amount_multipler
    });
    Ok(())
}


pub fn change_pool_point(ctx: Context<ChangePoolSetting>, point: u64) -> Result<()> {
    let state = &mut ctx.accounts.state;
    for pool_acc in ctx.remaining_accounts.iter() {
        let loader = &mut Account::<FarmPoolAccount>::try_from(&pool_acc)?;
        loader.update(state, &ctx.accounts.clock)?;
    }
    let pool = &mut ctx.accounts.pool;
    state.total_point = state.total_point.safe_sub(pool.point)?.safe_add(point)?;
    pool.point = point;
    emit!(PoolPointChanged {
        pool: ctx.accounts.pool.key(),
        point
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateFarmPool<'info> {
    #[account(
        init,
        seeds = [mint.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<FarmPoolAccount>()
    )]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    pub mint: Box<Account<'info, Mint>>,
    #[account(constraint = vault.owner == pool.key())]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}


#[derive(Accounts)]
pub struct CloseFarmPool<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump, has_one = authority)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump, has_one = authority, close = authority)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ChangePoolSetting<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump, has_one = authority)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}
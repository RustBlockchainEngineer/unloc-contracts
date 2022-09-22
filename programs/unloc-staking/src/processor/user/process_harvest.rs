use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::convert::TryInto;

use crate::{utils::*, states::*};

pub fn handle(ctx: Context<Harvest>) -> Result<()> {
    let extra_account = &mut ctx.accounts.extra_reward_account;
    let state = &ctx.accounts.state;
    let pool = &mut ctx.accounts.pool;
    let user = &mut ctx.accounts.user;

    pool.update(state, &ctx.accounts.clock)?;
    let user_lock_duration = user.lock_duration;
    user.calculate_reward_amount(
        pool,
        &extra_account.get_extra_reward_percentage(&user_lock_duration),
    )?;

    let total_reward = user
        .reward_amount
        .safe_add(user.extra_reward)?
        .try_into()
        .unwrap();

    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_vault.to_account_info(),
        authority: ctx.accounts.state.to_account_info(),
    };

    let seeds = &[b"state".as_ref(), &[state.bump]];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, total_reward)?;

    user.reward_amount = 0;
    user.extra_reward = 0;
    user.calculate_reward_debt(pool)?;
    emit!(UserHarvested {
        pool: ctx.accounts.pool.key(),
        user: ctx.accounts.user.key(),
        authority: ctx.accounts.authority.key(),
        amount: total_reward
    });
    Ok(())
}

#[derive(Accounts)]
pub struct Harvest<'info> {
    #[account(mut,
        seeds = [pool.key().as_ref(), authority.key().as_ref(), user.stake_seed.to_le_bytes().as_ref()], bump = user.bump, has_one = pool, has_one = authority)]
    pub user: Account<'info, FarmPoolUserAccount>,
    #[account(mut,
        seeds = [b"state".as_ref()], bump = state.bump)]
    pub state: Account<'info, StateAccount>,
    #[account(
        seeds = [b"extra".as_ref()], bump = extra_reward_account.bump)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut,
        seeds = [pool.mint.key().as_ref()], bump = pool.bump)]
    pub pool: Account<'info, FarmPoolAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = mint.key() == pool.mint)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut,
        constraint = reward_vault.owner == state.key())]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = user_vault.owner == authority.key())]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
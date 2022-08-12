use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use std::mem::size_of;
use std::str::FromStr;

use crate::{error::*, states::*, constant::*};

pub fn create_state(
    ctx: Context<CreateState>,
    token_per_second: u64,
    early_unlock_fee: u64,
    profile_levels: Vec<u128>,
) -> Result<()> {
    let initial_owner = Pubkey::from_str(INITIAL_OWNER).unwrap();
    require_keys_eq!(initial_owner, ctx.accounts.authority.key());

    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();

    require_keys_eq!(ctx.accounts.reward_mint.key(), unloc_mint);
    require_keys_eq!(ctx.accounts.reward_vault.mint, unloc_mint);
    require!(
        profile_levels.len() <= MAX_PROFILE_LEVEL,
        StakingError::OverflowMaxProfileLevel
    );
    let state = &mut ctx.accounts.state;
    state.authority = ctx.accounts.authority.key();
    state.bump = *ctx.bumps.get("state").unwrap();
    state.start_time = ctx.accounts.clock.unix_timestamp;
    state.token_per_second = token_per_second;
    state.early_unlock_fee = early_unlock_fee;
    state.reward_mint = ctx.accounts.reward_mint.key();
    state.reward_vault = ctx.accounts.reward_vault.key();
    state.fee_vault = ctx.accounts.fee_vault.key();
    state.profile_levels = profile_levels;
    Ok(())
}

pub fn create_extra_reward_configs(
    ctx: Context<CreateExtraRewardsConfigs>,
    configs: Vec<DurationExtraRewardConfig>,
) -> Result<()> {
    let extra_account = &mut ctx.accounts.extra_reward_account;
    extra_account.authority = ctx.accounts.authority.key();
    extra_account.bump = *ctx.bumps.get("extra_reward_account").unwrap();
    extra_account.configs = configs;
    extra_account.validate()?;
    Ok(())
}

pub fn set_extra_reward_configs(
    ctx: Context<SetExtraRewardsConfigs>,
    configs: Vec<DurationExtraRewardConfig>,
) -> Result<()> {
    let extra_account = &mut ctx.accounts.extra_reward_account;
    extra_account.configs = configs;
    extra_account.validate()?;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateState<'info> {
    #[account(
        init,
        seeds = [b"state".as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<StateAccount>() + 16 * MAX_PROFILE_LEVEL
    )]
    pub state: Account<'info, StateAccount>,
    #[account(constraint = reward_vault.owner == state.key())]
    pub reward_vault: Account<'info, TokenAccount>,
    pub reward_mint: Box<Account<'info, Mint>>,
    pub fee_vault: Account<'info, TokenAccount>,
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
#[instruction()]
pub struct CreateExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()],
        bump = state.bump,
        has_one = authority
    )]
    pub state: Account<'info, StateAccount>,
    #[account(init,
        seeds = [b"extra".as_ref()], bump, payer = authority, space = 8 + 37 + MAX_LEVEL * 16)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"extra".as_ref()], bump = extra_reward_account.bump, has_one = authority)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
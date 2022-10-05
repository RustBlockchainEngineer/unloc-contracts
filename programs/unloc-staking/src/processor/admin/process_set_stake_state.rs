use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::mem::size_of;
use std::str::FromStr;

use crate::{error::*, states::*, utils::*};
use crate::program::UnlocStaking;
pub fn handle(
    ctx: Context<CreateState>,
    token_per_second: u64,
    early_unlock_fee: u64,
    profile_levels: Vec<u128>,
) -> Result<()> {
    let user_stake_acct_seeds: [u8; 20] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
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
    state.stake_acct_seeds = user_stake_acct_seeds;
    state.liquidity_mining_stake_seed = 60;
    Ok(())
}

#[derive(Accounts)]
#[instruction(
    token_per_second: u64,
    early_unlock_fee: u64,
    profile_levels: Vec<u128>,
)]
pub struct CreateState<'info> {
    #[account(
        init,
        seeds = [b"state".as_ref()],
        bump,
        payer = payer,
        space = 8 + size_of::<StateAccount>() + 16 * MAX_PROFILE_LEVEL,
        constraint = profile_levels.len() <= MAX_PROFILE_LEVEL @ StakingError::OverflowMaxProfileLevel
    )]
    pub state: Account<'info, StateAccount>,
    #[account(
        constraint = reward_vault.owner == state.key() @ StakingError::InvalidOwner,
        constraint = reward_vault.mint == Pubkey::from_str(UNLOC_MINT).unwrap() @ StakingError::InvalidMint
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(
        address = Pubkey::from_str(UNLOC_MINT).unwrap() @ StakingError::InvalidMint
    )]
    pub reward_mint: Box<Account<'info, Mint>>,
    pub fee_vault: Account<'info, TokenAccount>,
    /// The program's upgrade authority.
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The unloc staking program.
    ///
    /// Provided here to check the upgrade authority.
    #[account(constraint = staking_program.programdata_address()? == Some(program_data.key()) @ StakingError::InvalidProgramData)]
    pub staking_program: Program<'info, UnlocStaking>,
    /// The program data account for the unloc staking program.
    ///
    /// Provided to check the upgrade authority.
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ StakingError::InvalidProgramUpgradeAuthority)]
    pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
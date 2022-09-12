use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
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
    /// The program's upgrade authority.
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The unloc staking program.
    ///
    /// Provided here to check the upgrade authority.
    #[account(constraint = staking_program.programdata_address()?.as_ref() == Some(&program_data.key()) @ StakingError::InvalidProgramData)]
    pub staking_program: Program<'info, UnlocStaking>,
    /// The program data account for the unloc staking program.
    ///
    /// Provided to check the upgrade authority.
    #[account(constraint = program_data.upgrade_authority_address.as_ref() == Some(&authority.key()) @ StakingError::InvalidProgramUpgradeAuthority)]
    pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
    #[account(constraint = token_program.key == &token::ID)]
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
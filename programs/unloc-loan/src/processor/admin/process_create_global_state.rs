use crate::{constant::*, states::*, utils::*, error::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::str::FromStr;
use crate::program::UnlocLoan;
pub fn handle(
    ctx: Context<CreateGlobalState>,
    accrued_interest_numerator: u64,
    denominator: u64,
    min_repaid_numerator: u64,
    apr_numerator: u64,
    expire_loan_duration: u64,
    reward_rate: u64,
    lender_rewards_percentage: u64,
    treasury_wallet: Pubkey,
) -> Result<()> {
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(ctx.accounts.reward_mint.key() == unloc_mint, "ctx.accounts.reward_mint")?;

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.global_state.reward_vault = ctx.accounts.reward_vault.key();
    ctx.accounts.global_state.tvl_sol = 0;
    ctx.accounts.global_state.tvl_usdc = 0;
    ctx.accounts.global_state.funded_amount = 0;
    ctx.accounts.global_state.distributed_amount = 0;
    ctx.accounts.global_state.rps_sol = 0;
    ctx.accounts.global_state.rps_usdc = 0;
    ctx.accounts.global_state.last_distributed_time = current_time;
    ctx.accounts.global_state.bump = *ctx.bumps.get("global_state").unwrap();
    ctx.accounts.global_state.reward_vault_bump = *ctx.bumps.get("reward_vault").unwrap();
    
    ctx.accounts.global_state.treasury_wallet = treasury_wallet;
    ctx.accounts.global_state.accrued_interest_numerator = accrued_interest_numerator;
    ctx.accounts.global_state.denominator = denominator;
    ctx.accounts.global_state.min_repaid_numerator = min_repaid_numerator;
    ctx.accounts.global_state.apr_numerator = apr_numerator;
    ctx.accounts.global_state.reward_rate = reward_rate;
    ctx.accounts.global_state.expire_loan_duration = expire_loan_duration;
    ctx.accounts.global_state.lender_rewards_percentage = lender_rewards_percentage;
    ctx.accounts.global_state.redemption_reset = 5;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = payer,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    pub reward_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        token::mint = reward_mint,
        token::authority = global_state,
        seeds = [REWARD_VAULT_TAG],
        bump,
        payer = payer,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    /// The unloc loan program.

    /// Provided here to check the upgrade authority.
    #[account(constraint = loan_program.programdata_address()? == Some(program_data.key()) @ LoanError::InvalidProgramData)]
    pub loan_program: Program<'info, UnlocLoan>,
    /// The program data account for the unloc loan program.
    
    /// Provided to check the upgrade authority.
    #[account(constraint = program_data.upgrade_authority_address == Some(super_owner.key()) @ LoanError::InvalidProgramUpgradeAuthority)]
    pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

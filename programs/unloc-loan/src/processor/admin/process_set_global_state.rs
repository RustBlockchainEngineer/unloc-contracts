use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;

pub fn handle(
    ctx: Context<SetGlobalState>, 
    accrued_interest_numerator: u64, 
    denominator: u64,     
    min_repaid_numerator: u64,
    apr_numerator: u64,
    expire_loan_duration: u64,
    reward_rate: u64,
    lender_rewards_percentage: u64
) -> Result<()> {
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(ctx.accounts.reward_mint.key() == unloc_mint)?;

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
        ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
        ctx.accounts.global_state.reward_vault = ctx.accounts.reward_vault.key();
        ctx.accounts.global_state.tvl_sol = 0;
        ctx.accounts.global_state.tvl_usdc = 0;
        ctx.accounts.global_state.funded_amount = 0;
        ctx.accounts.global_state.distributed_amount = 0;
        ctx.accounts.global_state.rps_sol = 0;
        ctx.accounts.global_state.rps_usdc = 0;
        ctx.accounts.global_state.last_distributed_time = current_time;
    }
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;
    
    ctx.accounts.global_state.super_owner = *ctx.accounts.new_super_owner.key;
    ctx.accounts.global_state.treasury_wallet = *ctx.accounts.treasury_wallet.key;
    ctx.accounts.global_state.accrued_interest_numerator = accrued_interest_numerator;
    ctx.accounts.global_state.denominator = denominator;
    ctx.accounts.global_state.min_repaid_numerator = min_repaid_numerator;
    ctx.accounts.global_state.apr_numerator = apr_numerator;
    ctx.accounts.global_state.reward_rate = reward_rate;
    ctx.accounts.global_state.expire_loan_duration = expire_loan_duration;
    ctx.accounts.global_state.lender_rewards_percentage = lender_rewards_percentage;
    

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetGlobalState <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = super_owner,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    pub reward_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = reward_mint,
        token::authority = global_state,
        seeds = [REWARD_VAULT_TAG],
        bump,
        payer = super_owner,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,
    /// CHECK: key only is used
    pub new_super_owner:AccountInfo<'info>,
    /// CHECK: key only is used
    pub treasury_wallet:AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

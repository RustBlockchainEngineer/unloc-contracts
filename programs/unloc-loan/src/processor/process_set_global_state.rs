use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;

pub fn process_set_global_state(
    ctx: Context<SetGlobalState>, 
    accrued_interest_numerator: u64, 
    denominator: u64, 
    apr_numerator: u64,
    reward_per_sol: u64,
    reward_per_usdc: u64,
    unloc_staking_pid: Pubkey,
    unloc_staking_pool_id: Pubkey,
    voting_pid: Pubkey,
    current_voting_num: u64,
) -> Result<()> {
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(ctx.accounts.reward_mint.key() == unloc_mint)?;

    if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
        ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    }
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.super_owner = *ctx.accounts.new_super_owner.key;
    ctx.accounts.global_state.treasury_wallet = *ctx.accounts.treasury_wallet.key;
    ctx.accounts.global_state.accrued_interest_numerator = accrued_interest_numerator;
    ctx.accounts.global_state.denominator = denominator;
    ctx.accounts.global_state.apr_numerator = apr_numerator;
    ctx.accounts.global_state.reward_per_sol = reward_per_sol;
    ctx.accounts.global_state.reward_per_usdc = reward_per_usdc;
    ctx.accounts.global_state.unloc_staking_pid = unloc_staking_pid;
    ctx.accounts.global_state.unloc_staking_pool_id = unloc_staking_pool_id;
    ctx.accounts.global_state.voting_pid = voting_pid;
    ctx.accounts.global_state.current_voting_num = current_voting_num;

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
}

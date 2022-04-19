use anchor_lang::prelude::*;
use anchor_spl::token::{Token};
use crate::{
    constant::*,
    states::*,
    utils::*,
};


pub fn process_set_global_state(ctx: Context<SetGlobalState>, accrued_interest_numerator: u64, denominator: u64, apr_numerator: u64, expire_duration_for_lender: u64) -> Result<()> {

    if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
        ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    }
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    ctx.accounts.global_state.super_owner = *ctx.accounts.new_super_owner.key;
    ctx.accounts.global_state.treasury_wallet = *ctx.accounts.treasury_wallet.key;
    ctx.accounts.global_state.accrued_interest_numerator = accrued_interest_numerator;
    ctx.accounts.global_state.denominator = denominator;
    ctx.accounts.global_state.apr_numerator = apr_numerator;
    ctx.accounts.global_state.expire_duration_for_lender = expire_duration_for_lender;

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    accrued_interest_numerator: u64, 
    denominator: u64, 
    apr_numerator: u64, 
    expire_duration_for_lender: u64
)]
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
    /// CHECK: key only is used
    pub new_super_owner:AccountInfo<'info>,
    /// CHECK: key only is used
    pub treasury_wallet:AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
    utils::*,
};
use anchor_spl::token::{ Token, TokenAccount};
pub fn handle(
    ctx: Context<SetVoting>, 
    voting_pid: Pubkey,
    voting: Pubkey,
) -> Result<()> {
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?;

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.global_state.distribute(
        ctx.accounts.reward_vault.amount, 
        current_time, 
        &ctx.accounts.chainlink_program.to_account_info(), 
        &ctx.accounts.sol_feed.to_account_info(), 
        &ctx.accounts.usdc_feed.to_account_info(), 
    )?;

    ctx.accounts.global_state.voting_pid = voting_pid;
    ctx.accounts.global_state.voting = voting;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetVoting <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,
    /// CHECK: safe
    pub chainlink_program:AccountInfo<'info>,
    /// CHECK: safe
    pub sol_feed:AccountInfo<'info>,
    /// CHECK: safe
    pub usdc_feed:AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

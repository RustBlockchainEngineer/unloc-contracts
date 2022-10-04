use crate::{constant::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
pub fn handle(ctx: Context<SetVoting>, voting: Pubkey) -> Result<()> {

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.global_state.distribute(
        ctx.accounts.reward_vault.amount,
        current_time,
        &ctx.accounts.chainlink_program.to_account_info(),
        &ctx.accounts.sol_feed.to_account_info(),
        &ctx.accounts.usdc_feed.to_account_info(),
    )?;

    ctx.accounts.global_state.voting = voting;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SetVoting<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump = global_state.reward_vault_bump,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: safe. this will be checked in the distribute function
    pub chainlink_program: AccountInfo<'info>,
    /// CHECK: safe. this will be checked in the distribute function
    pub sol_feed: AccountInfo<'info>,
    /// CHECK: safe. this will be checked in the distribute function
    pub usdc_feed: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

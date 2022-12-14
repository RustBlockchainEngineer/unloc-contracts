use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use crate::{
    error::*,
    constant::*,
    states::*,
    utils::*,
};
pub fn process_set_voting(
    ctx: Context<SetVoting>,
    voting_number: u64,
    voting_start_timestamp: u64,
    voting_end_timestamp: u64,
) -> Result<()> {
    if is_zero_account(&ctx.accounts.voting.to_account_info()) {
        ctx.accounts.global_state.voting_count =
            ctx.accounts.global_state.voting_count.safe_add(1)?;
        ctx.accounts.voting.voting_number = voting_number;
        ctx.accounts.voting.total_score = 0;
        ctx.accounts.voting.total_items = 0;
        ctx.accounts.voting.bump = *ctx.bumps.get("voting").unwrap();
    }
    ctx.accounts.voting.voting_start_timestamp = voting_start_timestamp;
    ctx.accounts.voting.voting_end_timestamp = voting_end_timestamp;
    Ok(())
}
#[derive(Accounts)]
#[instruction(voting_number: u64)]
pub struct SetVoting<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner @ VotingError::InvalidOwner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        init_if_needed,
        seeds = [VOTING_TAG, &voting_number.to_be_bytes()],
        bump,
        payer = payer,
        space = std::mem::size_of::<Voting>() + 8,
        constraint = voting_number <= global_state.voting_count @ VotingError::InvalidVotingNumber,
    )]
    pub voting: Box<Account<'info, Voting>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

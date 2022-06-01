use anchor_lang::prelude::*;
use anchor_spl::token::{Token};

use crate::{
    // error::*,
    constant::*,
    states::*,
    utils::*,
};
pub fn process_set_voting(ctx: Context<SetVoting>, voting_number: u64, voting_start_timestamp: u64, voting_end_timestamp: u64) -> Result<()> {
    assert_owner(ctx.accounts.global_state.super_owner, ctx.accounts.super_owner.key())?; 
    if is_zero_account(&ctx.accounts.voting.to_account_info()) {
        ctx.accounts.global_state.voting_count = ctx.accounts.global_state.voting_count.checked_add(1).unwrap();
        ctx.accounts.voting.voting_number = voting_number;
        ctx.accounts.voting.total_score = 0;
        ctx.accounts.voting.total_items = 0;
    }
    
    ctx.accounts.voting.voting_start_timestamp = voting_start_timestamp;
    ctx.accounts.voting.voting_end_timestamp = voting_end_timestamp;
    
    Ok(())
}
 
#[derive(Accounts)]
#[instruction(voting_number: u64)]
pub struct SetVoting<'info> {
    #[account(mut)]
    pub super_owner:  Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        init_if_needed,
        seeds = [VOTING_TAG, &voting_number.to_be_bytes()],
        bump,
        payer = super_owner,
        space = std::mem::size_of::<Voting>() + 8,
        constraint = voting_number <= global_state.voting_count,
    )]
    pub voting:Box<Account<'info, Voting>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
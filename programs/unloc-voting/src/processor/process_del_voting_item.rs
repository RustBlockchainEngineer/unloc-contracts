use anchor_lang::prelude::*;
use anchor_spl::token::Token;

use crate::{
    error::*,
    constant::*,
    states::*,
    utils::*,
};

pub fn process_del_voting_item(ctx: Context<DelVotingItem>) -> Result<()> {
    let score = ctx.accounts.voting_item.voting_score;
    ctx.accounts.voting.total_score = ctx.accounts.voting.total_score.safe_sub(score)?;
    ctx.accounts.voting.total_items = ctx.accounts.voting.total_items.safe_sub(1)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DelVotingItem<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner @ VotingError::InvalidOwner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [VOTING_TAG, &voting.voting_number.to_be_bytes()],
        bump = voting.bump,
    )]
    pub voting: Box<Account<'info, Voting>>,

    #[account(
        mut,
        close = super_owner,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), voting_item.key.as_ref()],
        bump = voting_item.bump,
    )]
    pub voting_item: Box<Account<'info, VotingItem>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

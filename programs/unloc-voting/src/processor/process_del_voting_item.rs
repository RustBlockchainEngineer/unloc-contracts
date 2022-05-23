use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};

use crate::{
    error::*,
    constant::*,
    states::*,
    utils::*,
};
use mpl_token_metadata::{state::Metadata};

pub fn process_del_voting_item(ctx: Context<DelVotingItem>) -> Result<()> { 
    let score = ctx.accounts.voting_item.voting_score;
    ctx.accounts.voting.total_score = ctx.accounts.voting.total_score.checked_sub(score).unwrap();
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DelVotingItem<'info> {
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
        seeds = [VOTING_TAG, &voting.voting_number.to_be_bytes()],
        bump,
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        mut,
        close = super_owner,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), voting_item.key.as_ref()],
        bump,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
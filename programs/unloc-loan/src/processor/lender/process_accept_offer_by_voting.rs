use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};
use anchor_lang::solana_program::{
    system_instruction,
    program::{
        invoke, 
    },
};
use unloc_voting::constant::{VOTING_TAG, VOTING_ITEM_TAG};
use unloc_voting::states::{Voting, VotingItem};

use crate::{
    //error::*,
    constant::*,
    utils::*,
    states::*,
};
use std::str::FromStr;
pub fn handle(ctx: Context<AcceptOfferByVoting>) -> Result<()> { 
    let total_point = ctx.accounts.voting.total_score;
    let collection_point = ctx.accounts.voting_item.voting_score;
    let accept_offer_ctx: Context<AcceptOffer> = Context::new(ctx.program_id, ctx.accounts.accept_offer_ctx, ctx.remaining_accounts, ctx.bumps);

    accept_offer(accept_offer_ctx, total_point, collection_point)
}

#[derive(Accounts)]
#[instruction()]
pub struct AcceptOfferByVoting<'info> {
    pub accept_offer_ctx: AcceptOffer,

    #[account(
        mut,
        seeds = [VOTING_TAG, &global_state.current_voting_num.to_be_bytes()],
        seeds::program = global_state.voting_pid,
        bump,
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        mut,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), offer.collection.as_ref()],
        seeds::program = global_state.voting_pid,
        bump,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,
}

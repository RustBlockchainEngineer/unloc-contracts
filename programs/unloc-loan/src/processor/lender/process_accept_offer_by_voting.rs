use anchor_lang::prelude::*;
use unloc_voting::constant::{VOTING_TAG, VOTING_ITEM_TAG};
use unloc_voting::states::{Voting, VotingItem};

use crate::{
    process_accept_offer::*
};
pub fn handle<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, AcceptOfferByVoting<'info>>) -> Result<()> { 
    let total_point = ctx.accounts.voting.total_score;
    let collection_point = ctx.accounts.voting_item.voting_score;
    let accept_offer_ctx: Context<'a, 'b, 'c, 'info, AcceptOffer<'info>> = Context::new(ctx.program_id, &mut ctx.accounts.accept_offer_ctx, ctx.remaining_accounts, ctx.bumps);

    accept_offer(accept_offer_ctx, total_point, collection_point)
}

#[derive(Accounts)]
#[instruction()]
pub struct AcceptOfferByVoting<'info> {
    pub accept_offer_ctx: AcceptOffer<'info>,

    #[account(
        mut,
        seeds = [VOTING_TAG, &voting.voting_number.to_be_bytes()],
        seeds::program = accept_offer_ctx.global_state.voting_pid,
        bump,
        constraint = accept_offer_ctx.global_state.voting == voting.key()
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        mut,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), accept_offer_ctx.offer.collection.as_ref()],
        seeds::program = accept_offer_ctx.global_state.voting_pid,
        bump,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,
}

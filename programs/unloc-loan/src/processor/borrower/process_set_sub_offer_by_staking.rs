use anchor_lang::prelude::*;

use crate::{
    process_set_sub_offer::*
};
use unloc_staking::{FarmPoolUserAccount};
pub fn handle<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, SetSubOfferByStaking<'info>>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
    let profile_level = ctx.accounts.staking_user.profile_level;
    let set_sub_offer_ctx: Context<'a, 'b, 'c, 'info, SetSubOffer<'info>> = Context::new(ctx.program_id, &mut ctx.accounts.sub_offer_ctx, ctx.remaining_accounts, ctx.bumps);
    set_sub_offer(set_sub_offer_ctx, offer_amount, sub_offer_number, loan_duration, min_repaid_numerator, apr_numerator, profile_level)
}

#[derive(Accounts)]
#[instruction(offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64)]
pub struct SetSubOfferByStaking<'info> {
    sub_offer_ctx: SetSubOffer<'info>,

    #[account( 
        seeds = [staking_user.pool.as_ref(), sub_offer_ctx.borrower.key().as_ref()], 
        seeds::program = sub_offer_ctx.global_state.unloc_staking_pid,
        bump
    )]
    pub staking_user: Account<'info, FarmPoolUserAccount>,
}
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount,Mint};

use crate::{
    constant::*,
    states::*,
    utils::*
};
use std::str::FromStr;
use unloc_staking::{FarmPoolUserAccount};
pub fn handle(ctx: Context<SetSubOfferByStaking>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
    let profile_level = ctx.accounts.staking_user.profile_level;
    let set_sub_offer_ctx: Context<SetSubOffer> = Context::new(ctx.program_id, ctx.accounts.sub_offer_ctx, ctx.remaining_accounts, ctx.bumps);
    set_sub_offer(set_sub_offer_ctx, offer_amount, sub_offer_number, loan_duration, min_repaid_numerator, apr_numerator, profile_level)
}

#[derive(Accounts)]
#[instruction(offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64)]
pub struct SetSubOfferByStaking<'info> {
    sub_offer_ctx: SetSubOffer,

    #[account( 
        seeds = [staking_user.pool.as_ref(), borrower.key().as_ref()], 
        seeds::program = global_state.unloc_staking_pid,
        bump
    )]
    pub staking_user: Account<'info, FarmPoolUserAccount>,
}
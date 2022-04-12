use anchor_lang::prelude::*;
//use anchor_spl::token::{self,  MintTo, Transfer, ID};

use crate::{
    //error::*,
    //constant::*,
    contexts::*,
    states::*,
    utils::*
};

pub fn process_set_sub_offer(ctx: Context<SetSubOffer>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
    if is_zero_account(&ctx.accounts.sub_offer.to_account_info()) {
        ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Proposed);
        ctx.accounts.offer.sub_offer_count += 1;
        ctx.accounts.sub_offer.offer = ctx.accounts.offer.key();
        ctx.accounts.sub_offer.nft_mint = ctx.accounts.offer.nft_mint;
        ctx.accounts.sub_offer.borrower = ctx.accounts.offer.borrower;
    }
    
    ctx.accounts.sub_offer.offer_mint = ctx.accounts.offer_mint.key();
    ctx.accounts.sub_offer.offer_amount = offer_amount;
    ctx.accounts.sub_offer.sub_offer_number = sub_offer_number;
    ctx.accounts.sub_offer.loan_duration = loan_duration;
    ctx.accounts.sub_offer.min_repaid_numerator = min_repaid_numerator;
    ctx.accounts.sub_offer.apr_numerator = apr_numerator;
    
    Ok(())
}

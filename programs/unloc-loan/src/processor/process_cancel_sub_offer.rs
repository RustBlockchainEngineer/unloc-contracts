use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
};

pub fn process_cancel_sub_offer(ctx: Context<CancelSubOffer>, ) -> Result<()> { 
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Canceled);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CancelSubOffer<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump,
    )]
    pub offer:Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump,
    )]
    pub sub_offer:Box<Account<'info, SubOffer>>,
}

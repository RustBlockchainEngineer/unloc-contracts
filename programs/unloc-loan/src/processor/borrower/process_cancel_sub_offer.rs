use anchor_lang::prelude::*;
use crate::{
    constant::*,
    states::*,
    utils::*
};

pub fn handle(ctx: Context<CancelSubOffer>, ) -> Result<()> { 
    require(ctx.accounts.sub_offer.state == SubOfferState::get_state(SubOfferState::Proposed) || ctx.accounts.sub_offer.state == SubOfferState::get_state(SubOfferState::NFTClaimed))?;
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
    bump = offer.bump,
    )]
    pub offer:Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    )]
    pub sub_offer:Box<Account<'info, SubOffer>>,
}

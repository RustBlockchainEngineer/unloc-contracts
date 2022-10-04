use crate::{constant::*, states::*, utils::*};
use anchor_lang::prelude::*;

pub fn handle(ctx: Context<DeleteSubOffer>) -> Result<()> {
    ctx.accounts.offer.deleted_sub_offer_count.safe_add(1)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DeleteSubOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump = offer.bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    constraint = sub_offer.state == SubOfferState::get_state(SubOfferState::Proposed)
        || sub_offer.state == SubOfferState::get_state(SubOfferState::NFTClaimed),
    close = borrower
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint};

use crate::{constant::*, states::*, error::*};
use std::str::FromStr;

pub fn handle(
    ctx: Context<UpdateSubOffer>,
    offer_amount: u64,
    loan_duration: u64,
    apr_numerator: u64,
) -> Result<()> {
    ctx.accounts.sub_offer.offer_mint = ctx.accounts.offer_mint.key();
    ctx.accounts.sub_offer.offer_mint_decimals = ctx.accounts.offer_mint.decimals;
    ctx.accounts.sub_offer.offer_amount = offer_amount;
    ctx.accounts.sub_offer.loan_duration = loan_duration;
    ctx.accounts.sub_offer.apr_numerator = apr_numerator;

    Ok(())
}
#[derive(Accounts)]
#[instruction(
    offer_amount: u64,
    loan_duration: u64,
    apr_numerator: u64
)]
pub struct UpdateSubOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(mut,
        seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
        bump = offer.bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(
    mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    constraint = sub_offer.state == SubOfferState::get_state(SubOfferState::Proposed) @ LoanError::InvalidState
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    // offer_mint.key() == unloc_mint || // featured offer is not implemented yet
    #[account(
        constraint = offer_mint.key() == Pubkey::from_str(USDC_MINT).unwrap() 
        || offer_mint.key() == Pubkey::from_str(WSOL_MINT).unwrap() @ LoanError::InvalidMint
    )]
    pub offer_mint: Box<Account<'info, Mint>>,
}

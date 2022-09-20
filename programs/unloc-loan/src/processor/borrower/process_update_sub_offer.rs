use anchor_lang::prelude::*;
use anchor_spl::token::{Mint};

use crate::{constant::*, states::*, utils::*};
use std::str::FromStr;

pub fn handle(
    ctx: Context<UpdateSubOffer>,
    offer_amount: u64,
    loan_duration: u64,
    apr_numerator: u64,
) -> Result<()> {
    
    require(
        ctx.accounts.sub_offer.state == SubOfferState::get_state(SubOfferState::Proposed),
        "wrong sub_offer state"
    )?;

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    // let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(
        // ctx.accounts.offer_mint.key() == unloc_mint || // featured offer is not implemented yet
        ctx.accounts.offer_mint.key() == usdc_mint || ctx.accounts.offer_mint.key() == wsol_mint,
        "offer_mint"
    )?;

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

    // init_if_needed is safe above solana-program v1.10.29
    #[account(
    mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    pub offer_mint: Box<Account<'info, Mint>>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount,Mint};

use crate::{
    constant::*,
    states::*,
    utils::*
};
use std::str::FromStr;
use staking::{FarmPoolUserAccount};
pub fn process_set_sub_offer(ctx: Context<SetSubOffer>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
    let profile_level = ctx.accounts.staking_user.profile_level;
    let available_sub_offer_count = (DEFULT_SUB_OFFER_COUNT + profile_level * SUB_OFFER_COUNT_PER_LEVEL) as u64;
    require(ctx.accounts.offer.sub_offer_count - ctx.accounts.offer.start_sub_offer_num < available_sub_offer_count)?;

    if is_zero_account(&ctx.accounts.sub_offer.to_account_info()) {
        ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Proposed);
        ctx.accounts.offer.sub_offer_count += 1;
        ctx.accounts.sub_offer.offer = ctx.accounts.offer.key();
        ctx.accounts.sub_offer.nft_mint = ctx.accounts.offer.nft_mint;
        ctx.accounts.sub_offer.borrower = ctx.accounts.offer.borrower;
    }
    
    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(ctx.accounts.offer_mint.key() == wsol_mint || ctx.accounts.offer_mint.key() == usdc_mint || ctx.accounts.offer_mint.key() == unloc_mint)?;

    ctx.accounts.sub_offer.offer_mint = ctx.accounts.offer_mint.key();
    ctx.accounts.sub_offer.offer_amount = offer_amount;
    ctx.accounts.sub_offer.sub_offer_number = sub_offer_number;
    ctx.accounts.sub_offer.loan_duration = loan_duration;
    ctx.accounts.sub_offer.min_repaid_numerator = min_repaid_numerator;
    ctx.accounts.sub_offer.apr_numerator = apr_numerator;
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64)]
pub struct SetSubOffer<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,

    #[account(
    seeds = [GLOBAL_STATE_TAG],
    bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    
    #[account(mut,
        seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
        bump,
    )]
    pub offer:Box<Account<'info, Offer>>,

    #[account(
    init_if_needed,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer_number.to_be_bytes()],
    bump,
    payer = borrower,
    constraint = sub_offer_number <= offer.sub_offer_count,
    space = std::mem::size_of::<SubOffer>() + 8
    )]
    pub sub_offer:Box<Account<'info, SubOffer>>,

    #[account( 
        seeds = [staking_user.pool.as_ref(), borrower.key().as_ref()], 
        seeds::program = global_state.unloc_staking_pid,
        bump
    )]
    pub staking_user: Account<'info, FarmPoolUserAccount>,

    pub offer_mint: Box<Account<'info, Mint>>,
    /// CHECK: key only is used
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet:AccountInfo<'info>,

    #[account(init_if_needed,
        token::mint = offer_mint,
        token::authority = treasury_wallet,
        seeds = [TREASURY_VAULT_TAG, offer_mint.key().as_ref()],
        bump,
        payer = borrower)]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
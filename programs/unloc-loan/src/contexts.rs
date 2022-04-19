use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount,Mint};


use crate::{
    states::*,
    constant::*,
};

#[derive(Accounts)]
#[instruction(
    accrued_interest_numerator: u64, 
    denominator: u64, 
    apr_numerator: u64, 
    expire_duration_for_lender: u64
)]
pub struct SetGlobalState <'info>{
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = super_owner,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    /// CHECK: key only is used
    pub new_super_owner:AccountInfo<'info>,
    /// CHECK: key only is used
    pub treasury_wallet:AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction()]
pub struct SetOffer<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,
    #[account(
    init_if_needed,
    seeds = [OFFER_TAG, borrower.key().as_ref(), nft_mint.key().as_ref()],
    bump,
    payer = borrower,
    space = std::mem::size_of::<Offer>() + 8
    )]
    pub offer:Box<Account<'info, Offer>>,

    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(init_if_needed,
        token::mint = nft_mint,
        token::authority = offer,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
        payer = borrower,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = user_vault.mint == nft_mint.key(),
        constraint = user_vault.owner == borrower.key()
    )]
    pub user_vault: Box<Account<'info, TokenAccount>>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
#[instruction()]
pub struct CancelOffer<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump,
    )]
    pub offer:Box<Account<'info, Offer>>,

    #[account(mut,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        constraint = borrower.key() == user_vault.owner,
        constraint = user_vault.mint == offer.nft_mint
    )]
    pub user_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
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

#[derive(Accounts)]
#[instruction()]
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub lender:  Signer<'info>,

    /// CHECK: we use this account for owner
    pub borrower:  AccountInfo<'info>,

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

    #[account(mut,
        constraint = sub_offer.offer_mint == offer_mint.key()
    )]
    pub offer_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction()]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,

    /// CHECK: we use this account for owner
    pub lender:  AccountInfo<'info>,
    
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    /// CHECK: key only is used
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet:AccountInfo<'info>,

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

    
    #[account(mut,
        constraint = borrower_nft_vault.mint == offer.nft_mint,
        constraint = borrower_nft_vault.owner == borrower.key()
    )]
    pub borrower_nft_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        seeds = [TREASURY_VAULT_TAG, sub_offer.offer_mint.as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimCollateral<'info> {
    #[account(mut)]
    pub lender:  Signer<'info>,
    
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    /// CHECK: key only
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet:AccountInfo<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, offer.borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump,
    )]
    pub offer:Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump,
    )]
    pub sub_offer:Box<Account<'info, SubOffer>>,
    
    #[account(mut,
        constraint = lender_nft_vault.mint == offer.nft_mint,
        constraint = lender_nft_vault.owner == lender.key()
    )]
    pub lender_nft_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        seeds = [TREASURY_VAULT_TAG, sub_offer.offer_mint.as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

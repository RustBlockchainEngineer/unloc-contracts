use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};

use crate::{
    error::*,
    constant::*,
    states::*,
    utils::*,
};
use mpl_token_metadata::{state::Metadata};

pub fn process_set_offer(ctx: Context<SetOffer>) -> Result<()> { 
    let metadata = Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;
    let collection = metadata.collection.unwrap();
    if is_zero_account(&ctx.accounts.offer.to_account_info()) {
        ctx.accounts.offer.state = OfferState::get_state(OfferState::Proposed);
        ctx.accounts.offer.sub_offer_count = 0;
        ctx.accounts.offer.borrower = ctx.accounts.borrower.key();
        ctx.accounts.offer.nft_mint = ctx.accounts.nft_mint.key();
        ctx.accounts.offer.nft_vault = ctx.accounts.nft_vault.key();
        ctx.accounts.offer.collection = collection.key;
    }
    if ctx.accounts.user_vault.amount > 0 {
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_vault.to_account_info(),
            to: ctx.accounts.nft_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, 1)?;
        ctx.accounts.offer.state = OfferState::get_state(OfferState::Proposed);
        ctx.accounts.offer.start_sub_offer_num = ctx.accounts.offer.sub_offer_count;
    }
    else {
        return Err(error!(LoanError::InvalidAmount));
    }
    Ok(())
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
    /// CHECK: metadata from token meta program. it will be checked in the contract function
    pub nft_metadata: AccountInfo<'info>,

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
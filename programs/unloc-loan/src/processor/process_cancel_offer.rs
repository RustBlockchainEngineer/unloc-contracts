use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{
    constant::*,
    states::*,
    utils::*,
};

pub fn process_cancel_offer(ctx: Context<CancelOffer>) -> Result<()> { 
    let borrower = &mut ctx.accounts.borrower;
    let borrower_key = borrower.key();

    ctx.accounts.offer.state = OfferState::get_state(OfferState::Canceled);
    if ctx.accounts.nft_vault.amount > 0 {
        // transfer from user to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.nft_vault.to_account_info(),
            to: ctx.accounts.user_vault.to_account_info(),
            authority: ctx.accounts.offer.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        let signer_seeds = &[
            OFFER_TAG, 
            borrower_key.as_ref(),
            ctx.accounts.offer.nft_mint.as_ref(),
            &[bump(&[OFFER_TAG, borrower_key.as_ref(),ctx.accounts.offer.nft_mint.as_ref()], ctx.program_id)],
        ];
        let signer = &[&signer_seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, ctx.accounts.nft_vault.amount)?;
    }
    Ok(())
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

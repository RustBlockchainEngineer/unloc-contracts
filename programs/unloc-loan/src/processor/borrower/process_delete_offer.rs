use crate::{constant::*, states::*, utils::*, error::*};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{self, Mint, Revoke, Token, TokenAccount};
use mpl_token_metadata::{id as metadata_id, instruction::thaw_delegated_account};

pub fn handle(ctx: Context<DeleteOffer>) -> Result<()> {
    let proposed = ctx.accounts.offer.state == OfferState::get_state(OfferState::Proposed);
    let nft_claimed = ctx.accounts.offer.state == OfferState::get_state(OfferState::NFTClaimed);
    require(
        proposed || nft_claimed,
        "ctx.accounts.offer.state"
    )?;

    if proposed {
        let borrower_key = ctx.accounts.borrower.key();
        let nft_mint_key = ctx.accounts.nft_mint.key();
    
        // Thaw with Offer PDA
        let offer_bump = ctx.accounts.offer.bump;
        let signer_seeds = &[
            OFFER_TAG.as_ref(),
            borrower_key.as_ref(),
            nft_mint_key.as_ref(),
            &[offer_bump],
        ];
    
        invoke_signed(
            &thaw_delegated_account(
                metadata_id(),
                ctx.accounts.offer.key(),
                ctx.accounts.user_vault.key(),
                ctx.accounts.edition.key(),
                ctx.accounts.nft_mint.key(),
            ),
            &[
                ctx.accounts.offer.to_account_info(),
                ctx.accounts.user_vault.to_account_info(),
                ctx.accounts.edition.to_account_info(),
                ctx.accounts.nft_mint.to_account_info(),
                ctx.accounts.metadata_program.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[signer_seeds],
        )?;
    
        // Revoke with offer PDA
        token::revoke(ctx.accounts.into_revoke_context())?;
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DeleteOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump = offer.bump,
    close = borrower
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(
        constraint = nft_mint.key() == offer.nft_mint @ LoanError::InvalidMint
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut,
        constraint = borrower.key() == user_vault.owner @ LoanError::InvalidOwner,
        constraint = user_vault.mint == offer.nft_mint @ LoanError::InvalidMint
    )]
    pub user_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: metaplex edition account
    pub edition: UncheckedAccount<'info>,
    /// CHECK: metaplex program
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}
impl<'info> DeleteOffer<'info> {
    fn into_revoke_context(&self) -> CpiContext<'_, '_, '_, 'info, Revoke<'info>> {
        let cpi_accounts = Revoke {
            source: self.user_vault.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

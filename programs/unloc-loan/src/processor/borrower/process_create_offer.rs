use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};
use mpl_token_metadata::{id as metadata_id, instruction::freeze_delegated_account};

use crate::{constant::*, error::*, states::*, utils::*};
use mpl_token_metadata::state::Metadata;

pub fn handle(ctx: Context<CreateOffer>) -> Result<()> {
    let metadata = Metadata::from_account_info(&ctx.accounts.nft_metadata.to_account_info())?;
    let collection = metadata.collection.unwrap();
    let collection_key = collection.key;
    require(metadata.mint == ctx.accounts.nft_mint.key(), "metadata.mint")?;

    let borrower_key = ctx.accounts.borrower.key();
    let nft_mint_key = ctx.accounts.nft_mint.key();

    ctx.accounts.offer.state = OfferState::get_state(OfferState::Proposed);
    ctx.accounts.offer.sub_offer_count = 0;
    ctx.accounts.offer.deleted_sub_offer_count = 0;
    ctx.accounts.offer.borrower = borrower_key.clone();
    ctx.accounts.offer.nft_mint = nft_mint_key.clone();
    ctx.accounts.offer.collection = collection_key;
    ctx.accounts.offer.creation_date = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.offer.bump = *ctx.bumps.get("offer").unwrap();

    if ctx.accounts.user_vault.amount > 0 {
        let offer_bump = *ctx.bumps.get("offer").unwrap();
        let offer_seeds = &[
            OFFER_TAG.as_ref(),
            borrower_key.as_ref(),
            nft_mint_key.as_ref(),
            &[offer_bump],
        ];

        // Approve with offer PDA
        token::approve(ctx.accounts.into_approve_context(), 1)?;

        // Freeze with offer PDA
        invoke_signed(
            &freeze_delegated_account(
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
            &[offer_seeds],
        )?;

        ctx.accounts.offer.state = OfferState::get_state(OfferState::Proposed);
    } else {
        return Err(error!(LoanError::InvalidAmount));
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
    init,
    seeds = [OFFER_TAG, borrower.key().as_ref(), nft_mint.key().as_ref()],
    bump,
    payer = payer,
    space = std::mem::size_of::<Offer>() + 8
    )]
    pub offer: Box<Account<'info, Offer>>,

    pub nft_mint: Box<Account<'info, Mint>>,

    /// CHECK: metadata from token meta program.
    #[account(
        seeds = [META_PREFIX, mpl_token_metadata::id().as_ref(), nft_mint.key().as_ref()],
        seeds::program = mpl_token_metadata::id(),
        bump,
    )]
    pub nft_metadata: AccountInfo<'info>,

    #[account(mut,
        constraint = user_vault.mint == nft_mint.key(),
        constraint = user_vault.owner == borrower.key()
    )]
    pub user_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: edition from token meta program.
    #[account(
        seeds = [META_PREFIX, metadata_id().as_ref(), nft_mint.key().as_ref(), EDITION_PREFIX],
        seeds::program = metadata_id(),
        bump,
    )]
    pub edition: AccountInfo<'info>,

    /// CHECK: metaplex program
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
impl<'info> CreateOffer<'info> {
    fn into_approve_context(&self) -> CpiContext<'_, '_, '_, 'info, Approve<'info>> {
        let cpi_accounts = Approve {
            to: self.user_vault.to_account_info().clone(),
            delegate: self.offer.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

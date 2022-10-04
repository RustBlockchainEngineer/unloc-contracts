use crate::{
    // error::*,
    constant::*,
    states::*,
    utils::*,
};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use mpl_token_metadata::{id as metadata_id, instruction::thaw_delegated_account};

pub fn handle(ctx: Context<ClaimExpiredCollateral>) -> Result<()> {

    let borrower_key = ctx.accounts.offer.borrower;
    let started_time = ctx.accounts.sub_offer.loan_started_time;
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let expire_loan_duration = ctx.accounts.global_state.expire_loan_duration;
    let loan_duration = ctx.accounts.sub_offer.loan_duration;
    let nft_mint_key = ctx.accounts.nft_mint.key();

    require(
        current_time
            > started_time
                .safe_add(loan_duration)?
                .safe_add(expire_loan_duration)?,
        "current_time"
    )?;

    ctx.accounts.sub_offer.loan_ended_time = current_time;

    // Thaw with Offer PDA
    let offer_bump = *ctx.bumps.get("offer").unwrap();
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
            ctx.accounts.borrower_nft_vault.key(),
            ctx.accounts.edition.key(),
            ctx.accounts.nft_mint.key(),
        ),
        &[
            ctx.accounts.offer.to_account_info(),
            ctx.accounts.borrower_nft_vault.to_account_info(),
            ctx.accounts.edition.to_account_info(),
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[signer_seeds],
    )?;

    // Transfer NFT from borrower's vault to admin's vault
    token::transfer(
        ctx.accounts
            .into_transfer_nft_context()
            .with_signer(&[signer_seeds]),
        1,
    )?;

    ctx.accounts.offer.state = OfferState::get_state(OfferState::NFTClaimed);
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::NFTClaimed);
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimExpiredCollateral<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    /// CHECK: key only
    #[account(mut,
        address = global_state.treasury_wallet
    )]
    pub treasury_wallet: AccountInfo<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, offer.borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump = offer.bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    #[account(mut,
        constraint = user_nft_vault.mint == offer.nft_mint,
        constraint = user_nft_vault.owner == super_owner.key()
    )]
    pub user_nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = borrower_nft_vault.mint == offer.nft_mint,
        constraint = borrower_nft_vault.owner == offer.borrower.key(),
        constraint = borrower_nft_vault.amount > 0
    )]
    pub borrower_nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        address = offer.nft_mint
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    /// CHECK: metaplex edition account
    pub edition: UncheckedAccount<'info>,
    /// CHECK: metaplex program
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
impl<'info> ClaimExpiredCollateral<'info> {
    fn into_transfer_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.borrower_nft_vault.to_account_info().clone(),
            to: self.user_nft_vault.to_account_info().clone(),
            authority: self.offer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

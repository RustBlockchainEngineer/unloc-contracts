use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{
    // error::*,
    constant::*,
    states::*,
    utils::*
};
pub fn process_claim_expired_collateral(ctx: Context<ClaimExpiredCollateral>) -> Result<()> { 
    require(ctx.accounts.nft_vault.amount > 0)?;

    let borrower_key = ctx.accounts.offer.borrower;
    let started_time = ctx.accounts.sub_offer.loan_started_time;
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let expire_loan_duration = ctx.accounts.global_state.expire_loan_duration;
    let loan_duration = ctx.accounts.sub_offer.loan_duration;

    require(current_time > started_time.checked_add(loan_duration).unwrap().checked_add(expire_loan_duration).unwrap())?;

    ctx.accounts.sub_offer.loan_ended_time = current_time;

    let cpi_accounts_offer = Transfer {
        from: ctx.accounts.nft_vault.to_account_info(),
        to: ctx.accounts.user_nft_vault.to_account_info(),
        authority: ctx.accounts.offer.to_account_info(),
    };
    let signer_seeds = &[
        OFFER_TAG, 
        borrower_key.as_ref(),
        ctx.accounts.offer.nft_mint.as_ref(),
        &[bump(&[
            OFFER_TAG, 
            borrower_key.as_ref(), 
            ctx.accounts.offer.nft_mint.as_ref()
        ], ctx.program_id)],
    ];
    let signer = &[&signer_seeds[..]];
    let cpi_program_offer = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_offer = CpiContext::new_with_signer(cpi_program_offer, cpi_accounts_offer, signer);
    token::transfer(cpi_ctx_offer, ctx.accounts.nft_vault.amount)?;

    ctx.accounts.offer.state = OfferState::get_state(OfferState::NFTClaimed);
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::NFTClaimed);
    
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimExpiredCollateral<'info> {
    #[account(mut)]
    pub super_owner:  Signer<'info>,
    
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
        has_one = super_owner
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
        constraint = user_nft_vault.mint == offer.nft_mint,
        constraint = user_nft_vault.owner == super_owner.key()
    )]
    pub user_nft_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

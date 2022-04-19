use anchor_lang::prelude::*;
use anchor_spl::token::{
    self,  
    //MintTo, 
    Transfer, 
    //ID
};

use crate::{
    error::*,
    constant::*,
    contexts::*,
    states::*,
    utils::*
};
use anchor_lang::solana_program::{
    system_instruction,
    program::{
        invoke, 
        // invoke_signed
    },
};
use std::str::FromStr;
pub fn process_claim_collateral(ctx: Context<ClaimCollateral>) -> Result<()> { 
    require(ctx.accounts.nft_vault.amount > 0)?;
    require(ctx.accounts.lender.key() == ctx.accounts.sub_offer.lender)?;

    let borrower_key = ctx.accounts.offer.borrower;
    let origin = ctx.accounts.sub_offer.offer_amount;
    let started_time = ctx.accounts.sub_offer.loan_started_time;
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let seconds_for_year = 3600 * 24 * 365;
    let unloc_apr = ctx.accounts.global_state.apr_numerator;
    let denominator = ctx.accounts.global_state.denominator;
    let loan_duration = ctx.accounts.sub_offer.loan_duration;

    require(current_time > started_time + loan_duration)?;

    let unloc_fee_amount = calc_fee(origin, unloc_apr * (current_time - started_time), seconds_for_year * denominator)?;

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    if ctx.accounts.sub_offer.offer_mint == wsol_mint {
        require(ctx.accounts.lender.lamports() >= unloc_fee_amount)?;
        // pay unloc_fee_amount to unloc
        invoke(
            &system_instruction::transfer(&ctx.accounts.lender.key(), &ctx.accounts.treasury_wallet.key(), unloc_fee_amount),
            &[
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }
    else {
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.sub_offer.lender)?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.sub_offer.offer_mint)?;
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.sub_offer.lender)?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.sub_offer.offer_mint)?;

        if unloc_fee_amount > ctx.accounts.lender_offer_vault.amount {
            return Err(LoanError::InvalidAmount.into());
        }

        // pay unloc_fee_amount to unloc
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_offer_vault.to_account_info(),
            to: ctx.accounts.treasury_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, unloc_fee_amount)?;
    }
    ctx.accounts.sub_offer.loan_ended_time = current_time;

    let cpi_accounts_offer = Transfer {
        from: ctx.accounts.nft_vault.to_account_info(),
        to: ctx.accounts.lender_nft_vault.to_account_info(),
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

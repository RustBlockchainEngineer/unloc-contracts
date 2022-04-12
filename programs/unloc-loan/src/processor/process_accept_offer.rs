use anchor_lang::prelude::*;
use anchor_spl::token::{
    self,  
    //MintTo, 
    Transfer, 
    //ID
};

use anchor_lang::solana_program::{
    system_instruction,
    program::{
        invoke, 
        // invoke_signed
    },
};

use crate::{
    //error::*,
    constant::*,
    contexts::*,
    utils::*,
    states::*,
};
use std::str::FromStr;
pub fn process_accept_offer(ctx: Context<AcceptOffer>) -> Result<()> { 
    require(ctx.accounts.sub_offer.sub_offer_number >= ctx.accounts.offer.start_sub_offer_num)?;
    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    if ctx.accounts.offer_mint.key() == wsol_mint {
        require(ctx.accounts.lender.lamports() >= ctx.accounts.sub_offer.offer_amount)?;
        invoke(
            &system_instruction::transfer(&ctx.accounts.lender.key, ctx.accounts.borrower.key, ctx.accounts.sub_offer.offer_amount),
            &[
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }
    else {
        require(ctx.accounts.lender_offer_vault.amount >= ctx.accounts.sub_offer.offer_amount)?;
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.lender.key())?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.offer_mint.key())?;
        require(ctx.accounts.borrower_offer_vault.owner == ctx.accounts.offer.borrower)?;
        require(ctx.accounts.borrower_offer_vault.mint == ctx.accounts.offer_mint.key())?;
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_offer_vault.to_account_info(),
            to: ctx.accounts.borrower_offer_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
    
        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
        token::transfer(cpi_ctx, ctx.accounts.sub_offer.offer_amount)?;
    }
    ctx.accounts.offer.state = OfferState::get_state(OfferState::Accepted);
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Accepted);
    ctx.accounts.sub_offer.lender = ctx.accounts.lender.key();
    
    ctx.accounts.sub_offer.loan_started_time = ctx.accounts.clock.unix_timestamp as u64;
    Ok(())
}

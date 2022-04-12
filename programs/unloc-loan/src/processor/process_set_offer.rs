use anchor_lang::prelude::*;
use anchor_spl::token::{
    self,  
    //MintTo, 
    Transfer, 
    //ID
};

use crate::{
    error::*,
    //constant::*,
    contexts::*,
    states::*,
    utils::*,
};

pub fn process_set_offer(ctx: Context<SetOffer>) -> Result<()> { 
    if is_zero_account(&ctx.accounts.offer.to_account_info()) {
        ctx.accounts.offer.state = OfferState::get_state(OfferState::Proposed);
        ctx.accounts.offer.sub_offer_count = 0;
        ctx.accounts.offer.borrower = ctx.accounts.borrower.key();
        ctx.accounts.offer.nft_mint = ctx.accounts.nft_mint.key();
        ctx.accounts.offer.nft_vault = ctx.accounts.nft_vault.key();
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

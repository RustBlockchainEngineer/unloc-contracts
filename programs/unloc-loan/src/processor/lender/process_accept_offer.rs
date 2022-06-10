use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};
use anchor_lang::solana_program::{
    system_instruction,
    program::{
        invoke, 
    },
};

use crate::{
    //error::*,
    constant::*,
    utils::*,
    states::*,
};
use chainlink_solana as chainlink;
use std::str::FromStr;
pub fn handle(ctx: Context<AcceptOffer>) -> Result<()> { 
    accept_offer(ctx, 0, 0)
}
pub fn accept_offer(ctx: Context<AcceptOffer>, total_point: u64, collection_point: u64) -> Result<()> {
    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let reward_vault_amount = ctx.accounts.reward_vault.amount;
    ctx.accounts.global_state.distribute(
        reward_vault_amount, 
        current_time, 
        &ctx.accounts.chainlink_program.to_account_info(), 
        &ctx.accounts.sol_feed.to_account_info(), 
        &ctx.accounts.usdc_feed.to_account_info()
    )?;
    let rps = if usdc_mint == ctx.accounts.sub_offer.offer_mint {
        ctx.accounts.global_state.rps_usdc
    } else if wsol_mint == ctx.accounts.sub_offer.offer_mint {
        ctx.accounts.global_state.rps_sol
    } else {0};
    ctx.accounts.sub_offer.update_rps(rps);

    require(ctx.accounts.sub_offer.sub_offer_number >= ctx.accounts.offer.start_sub_offer_num)?;
    require(ctx.accounts.offer.state == OfferState::get_state(OfferState::Proposed))?;

    
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

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.sub_offer.total_point = total_point;
    ctx.accounts.sub_offer.collection_point = collection_point;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub lender:  Signer<'info>,

    /// CHECK: we use this account for owner
    #[account(mut)]
    pub borrower:  AccountInfo<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

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

    
    /// CHECK: Safe
    pub chainlink_program:  AccountInfo<'info>,

    /// CHECK: Safe
    pub sol_feed:  AccountInfo<'info>,

    /// CHECK: Safe
    pub usdc_feed:  AccountInfo<'info>,

    #[account(
        seeds = [REWARD_VAULT_TAG],
        bump,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

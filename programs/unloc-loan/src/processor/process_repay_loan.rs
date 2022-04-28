use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{
    error::*,
    constant::*,
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
pub fn process_repay_loan(ctx: Context<RepayLoan>) -> Result<()> { 
    require(ctx.accounts.nft_vault.amount > 0)?;
    require(ctx.accounts.lender.key() == ctx.accounts.sub_offer.lender)?;

    let borrower_key = ctx.accounts.borrower.key();
    let origin = ctx.accounts.sub_offer.offer_amount;
    let started_time = ctx.accounts.sub_offer.loan_started_time;
    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let seconds_for_year = 3600 * 24 * 365;
    let offer_apr = ctx.accounts.sub_offer.apr_numerator;
    let unloc_apr = ctx.accounts.global_state.apr_numerator;
    let denominator = ctx.accounts.global_state.denominator;

    let needed_amount = origin + calc_fee(origin, offer_apr * (current_time - started_time),  seconds_for_year * denominator)?;
    let unloc_fee_amount = calc_fee(origin, unloc_apr * (current_time - started_time), seconds_for_year * denominator)?;

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    if ctx.accounts.sub_offer.offer_mint == wsol_mint {
        require(ctx.accounts.borrower.lamports() >= needed_amount + unloc_fee_amount)?;
        invoke(
            &system_instruction::transfer(&ctx.accounts.borrower.key(), &ctx.accounts.lender.key(), needed_amount),
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        // pay unloc_fee_amount to unloc
        invoke(
            &system_instruction::transfer(&ctx.accounts.borrower.key(), &ctx.accounts.treasury_wallet.key(), unloc_fee_amount),
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }
    else {
        require(ctx.accounts.borrower_offer_vault.owner == ctx.accounts.sub_offer.borrower)?;
        require(ctx.accounts.borrower_offer_vault.mint == ctx.accounts.sub_offer.offer_mint)?;
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.sub_offer.lender)?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.sub_offer.offer_mint)?;

        if needed_amount + unloc_fee_amount > ctx.accounts.borrower_offer_vault.amount {
            return Err(error!(LoanError::InvalidAmount));
        }
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_offer_vault.to_account_info(),
            to: ctx.accounts.lender_offer_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, needed_amount)?;

        // pay unloc_fee_amount to unloc
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_offer_vault.to_account_info(),
            to: ctx.accounts.treasury_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, unloc_fee_amount)?;
    }
    ctx.accounts.sub_offer.repaid_amount += needed_amount;
    ctx.accounts.sub_offer.loan_ended_time = current_time;
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Fulfilled);
    ctx.accounts.offer.state = OfferState::get_state(OfferState::Fulfilled);

    ctx.accounts.lender_reward.end_time = current_time;

    let cpi_accounts_offer = Transfer {
        from: ctx.accounts.nft_vault.to_account_info(),
        to: ctx.accounts.borrower_nft_vault.to_account_info(),
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
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower:  Signer<'info>,

    /// CHECK: we use this account for owner
    #[account(mut)]
    pub lender:  AccountInfo<'info>,
    
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    /// CHECK: key only is used
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet:AccountInfo<'info>,

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
    #[account(
        mut,
        seeds = [LENDER_REWARD_TAG, sub_offer.lender.as_ref(), sub_offer.key().as_ref()],
        bump,
        )]
    pub lender_reward:Box<Account<'info, LenderReward>>,

    
    #[account(mut,
        constraint = borrower_nft_vault.mint == offer.nft_mint,
        constraint = borrower_nft_vault.owner == borrower.key()
    )]
    pub borrower_nft_vault: Box<Account<'info, TokenAccount>>,
    
    #[account(mut,
        seeds = [NFT_VAULT_TAG, offer.key().as_ref()],
        bump,
    )]
    pub nft_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        seeds = [TREASURY_VAULT_TAG, sub_offer.offer_mint.as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

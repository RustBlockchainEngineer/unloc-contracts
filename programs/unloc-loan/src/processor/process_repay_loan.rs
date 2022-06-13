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
    let accrued_apr = ctx.accounts.global_state.accrued_interest_numerator;

    let min_duration = ctx.accounts.sub_offer.loan_duration / 2;
    let mut duration = current_time.checked_sub(started_time).unwrap();
    if duration < min_duration {
        duration = min_duration;
    }
    
    let accrued_amount = calc_fee(origin, offer_apr.checked_mul(duration).unwrap(),  denominator.checked_mul(seconds_for_year).unwrap())?;
    let accrued_unloc_fee = calc_fee(accrued_amount, accrued_apr,  denominator)?;
    let needed_amount = origin.checked_add(accrued_amount).unwrap()
        .checked_sub(accrued_unloc_fee).unwrap();
    let unloc_apr_fee = calc_fee(origin, unloc_apr.checked_mul(duration).unwrap(), denominator.checked_mul(seconds_for_year).unwrap())?;
    let unloc_fee_amount = accrued_unloc_fee.checked_add(unloc_apr_fee).unwrap();
    
    // log fees
    msg!("origin = {}, duration = {}", origin, duration);
    msg!("offer apr = {}%, unloc apr = {}%, accrued apr = {}%", offer_apr * 100 / denominator, unloc_apr * 100 / denominator, accrued_apr * 100 / denominator);
    msg!("interest by offer apr = {}", accrued_amount);
    msg!("interest by unloc apr = {}", unloc_apr_fee);
    msg!("accrued unloc fee = {}", accrued_unloc_fee);
    msg!("total unloc fee = {}", unloc_fee_amount);

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    if ctx.accounts.sub_offer.offer_mint == wsol_mint {
        require(ctx.accounts.borrower.lamports() >= needed_amount.checked_add(unloc_fee_amount).unwrap())?;
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

        let _borrower_offer_vault = needed_amount.checked_add(unloc_fee_amount).unwrap();
        if _borrower_offer_vault > ctx.accounts.borrower_offer_vault.amount {
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
    ctx.accounts.sub_offer.repaid_amount = ctx.accounts.sub_offer.repaid_amount.checked_add(needed_amount).unwrap();
    ctx.accounts.sub_offer.loan_ended_time = current_time;
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Fulfilled);
    ctx.accounts.offer.state = OfferState::get_state(OfferState::Fulfilled);

    ctx.accounts.user_reward.end_time = current_time;

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
        seeds = [LENDER_REWARD_TAG, sub_offer.lender.as_ref(), user_reward.borrower.as_ref(), sub_offer.key().as_ref()],
        bump,
        )]
    pub user_reward:Box<Account<'info, LenderReward>>,

    
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

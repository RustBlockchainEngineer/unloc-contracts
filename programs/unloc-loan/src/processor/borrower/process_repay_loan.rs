use crate::{constant::*, error::*, states::*, utils::*};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, program::invoke_signed, system_instruction};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, Revoke};
use mpl_token_metadata::{id as metadata_id, instruction::thaw_delegated_account};
use std::str::FromStr;

pub fn handle(ctx: Context<RepayLoan>) -> Result<()> {
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

    let duration = current_time.checked_sub(started_time).unwrap();
    let accrued_amount = calc_fee(
        origin,
        offer_apr.checked_mul(duration).unwrap(),
        denominator.checked_mul(seconds_for_year).unwrap(),
    )?;
    let accrued_unloc_fee = calc_fee(accrued_amount, accrued_apr, denominator)?;
    let needed_amount = origin
        .checked_add(accrued_amount)
        .unwrap()
        .checked_sub(accrued_unloc_fee)
        .unwrap();
    let unloc_apr_fee = calc_fee(
        origin,
        unloc_apr.checked_mul(duration).unwrap(),
        denominator.checked_mul(seconds_for_year).unwrap(),
    )?;
    let unloc_fee_amount = accrued_unloc_fee.checked_add(unloc_apr_fee).unwrap();
    // log fees
    msg!("origin = {}, duration = {}", origin, duration);
    msg!(
        "offer apr = {}%, unloc apr = {}%, accrued apr = {}%",
        offer_apr * 100 / denominator,
        unloc_apr * 100 / denominator,
        accrued_apr * 100 / denominator
    );
    msg!("interest by offer apr = {}", accrued_amount);
    msg!("interest by unloc apr = {}", unloc_apr_fee);
    msg!("accrued unloc fee = {}", accrued_unloc_fee);
    msg!("total unloc fee = {}", unloc_fee_amount);

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    if ctx.accounts.sub_offer.offer_mint == wsol_mint {
        require(
            ctx.accounts.borrower.lamports()
                >= needed_amount.checked_add(unloc_fee_amount).unwrap(),
        )?;
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.borrower.key(),
                &ctx.accounts.lender.key(),
                needed_amount,
            ),
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        // pay unloc_fee_amount to unloc
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.borrower.key(),
                &ctx.accounts.treasury_wallet.key(),
                unloc_fee_amount,
            ),
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    } else {
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
    ctx.accounts.sub_offer.repaid_amount = ctx
        .accounts
        .sub_offer
        .repaid_amount
        .checked_add(needed_amount)
        .unwrap();
    ctx.accounts.sub_offer.loan_ended_time = current_time;
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Fulfilled);
    ctx.accounts.offer.state = OfferState::get_state(OfferState::Fulfilled);

    ctx.accounts.user_reward.end_time = current_time;

    // Thaw borrower_nft_vault with offer PDA
    let nft_mint_key = ctx.accounts.nft_mint.key();
    let signer_seeds = &[
        OFFER_TAG.as_ref(),
        borrower_key.as_ref(),
        nft_mint_key.as_ref(),
        &[bump(
            &[OFFER_TAG, borrower_key.as_ref(), nft_mint_key.as_ref()],
            ctx.program_id,
        )],
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

    // Revoke with offer PDA
    token::revoke(
        ctx.accounts
            .into_revoke_context(),
    )?;

    ctx.accounts.offer.state = OfferState::get_state(OfferState::NFTClaimed);
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::NFTClaimed);
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,

    /// CHECK: we use this account for owner
    #[account(mut)]
    pub lender: AccountInfo<'info>,
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    /// CHECK: key only is used
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet: AccountInfo<'info>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump,
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,
    #[account(
        mut,
        seeds = [LENDER_REWARD_TAG, sub_offer.lender.as_ref(), user_reward.borrower.as_ref(), sub_offer.key().as_ref()],
        bump,
        )]
    pub user_reward: Box<Account<'info, UserReward>>,

    #[account(
        constraint = nft_mint.key() == offer.nft_mint
    )]
    pub nft_mint: Box<Account<'info, Mint>>,
    #[account(mut,
        constraint = borrower_nft_vault.mint == offer.nft_mint,
        constraint = borrower_nft_vault.owner == borrower.key()
    )]
    pub borrower_nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        seeds = [TREASURY_VAULT_TAG, sub_offer.offer_mint.as_ref()],
        bump
    )]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

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

    /// CHECK: metaplex edition account
    pub edition: UncheckedAccount<'info>,
    /// CHECK: metaplex program
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}
impl<'info> RepayLoan<'info> {
    fn into_revoke_context(&self) -> CpiContext<'_, '_, '_, 'info, Revoke<'info>> {
        let cpi_accounts = Revoke {
            source: self.borrower_nft_vault.to_account_info().clone(),
            authority: self.borrower.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

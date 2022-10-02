use crate::{constant::*, error::*, states::*, utils::*};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::{invoke, invoke_signed},
    system_instruction,
};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use mpl_token_metadata::{id as metadata_id, instruction::thaw_delegated_account};
use std::str::FromStr;
use unloc_staking::{
    states::UserStateAccount,
};

pub fn handle(ctx: Context<ClaimCollateral>) -> Result<()> {
    require(ctx.accounts.borrower_nft_vault.amount > 0, "borrower_nft_vault.amount")?;
    require(ctx.accounts.lender.key() == ctx.accounts.sub_offer.lender, "lender")?;

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let reward_vault_amount = ctx.accounts.reward_vault.amount;
    ctx.accounts.global_state.distribute(
        reward_vault_amount,
        current_time,
        &ctx.accounts.chainlink_program.to_account_info(),
        &ctx.accounts.sol_feed.to_account_info(),
        &ctx.accounts.usdc_feed.to_account_info(),
    )?;
    let offer_mint = ctx.accounts.sub_offer.offer_mint;
    ctx.accounts
        .sub_offer
        .update_rps(&ctx.accounts.global_state, &offer_mint)?;
    let borrower_key = ctx.accounts.offer.borrower;
    let loan_amount = ctx.accounts.sub_offer.offer_amount;
    let started_time = ctx.accounts.sub_offer.loan_started_time;
    let seconds_for_year = 3600 * 24 * 365;
    let unloc_apr = ctx.accounts.global_state.apr_numerator;
    let offer_apr = ctx.accounts.sub_offer.apr_numerator;
    let denominator = ctx.accounts.global_state.denominator;
    let loan_duration = ctx.accounts.sub_offer.loan_duration;
    let accrued_apr = ctx.accounts.global_state.accrued_interest_numerator;
    let nft_mint_key = ctx.accounts.nft_mint.key();

    let duration = current_time.safe_sub(started_time)?;

    require(current_time > started_time.safe_add(loan_duration)?, "current_time")?;

    // calculates interest due
    let interest_amount = calc_fee(
        loan_amount,
        offer_apr.safe_mul(duration)?,
        denominator.safe_mul(seconds_for_year)?,
    )?;

    // let accrued_unloc_fee = calc_fee(interest_amount, accrued_apr, denominator)?;
    // calculate amount unloc takes from Lender's interest
    let accrued_unloc_fee = calc_fee_with_profile_level(
        interest_amount,
        accrued_apr,
        denominator,
        ctx.accounts.lender_user_stake_state.profile_level
    )?;

    // calculate amount Lender pays in apr fee
    let _unloc_fee_amount = calc_fee_with_profile_level(
        loan_amount,
        unloc_apr.safe_mul(duration)?,
        denominator.safe_mul(seconds_for_year)?,
        ctx.accounts.lender_user_stake_state.profile_level
    )?;
    
    let unloc_fee_amount = accrued_unloc_fee.safe_add(_unloc_fee_amount)?;

    // log fees
    msg!("loan amount = {}, loan duration = {}", loan_amount, duration);
    msg!(
        "offer apr = {}%, unloc apr = {}%, accrued apr = {}%",
        offer_apr * 100 / denominator,
        unloc_apr * 100 / denominator,
        accrued_apr * 100 / denominator
    );
    msg!("interest by offer apr = {}", interest_amount);
    msg!("accrued unloc fee = {}", accrued_unloc_fee);
    msg!("total unloc fee = {}", unloc_fee_amount);

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();

    if ctx.accounts.sub_offer.offer_mint == wsol_mint {
        require(ctx.accounts.lender.lamports() >= unloc_fee_amount, "lender.lamports()")?;
        // pay unloc_fee_amount to unloc
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.lender.key(),
                &ctx.accounts.treasury_wallet.key(),
                unloc_fee_amount,
            ),
            &[
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.treasury_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    } else if ctx.accounts.sub_offer.offer_mint == usdc_mint {
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.sub_offer.lender, "lender_offer_vault.owner")?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.sub_offer.offer_mint, "lender_offer_vault.mint")?;

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
    } else {
        return Err(error!(LoanError::NotAllowed));
    }
    ctx.accounts.sub_offer.loan_ended_time = current_time;

    // Thaw with Offer PDA
    let offer_bump = ctx.accounts.offer.bump;
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

    // Transfer NFT from borrower's vault to lender's vault
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
pub struct ClaimCollateral<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    /// CHECK: key only
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
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
    #[account(
        constraint = nft_mint.key() == offer.nft_mint
    )]
    pub nft_mint: Box<Account<'info, Mint>>,

    #[account(mut,
        constraint = lender_nft_vault.mint == offer.nft_mint,
        constraint = lender_nft_vault.owner == lender.key()
    )]
    pub lender_nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        constraint = borrower_nft_vault.mint == offer.nft_mint,
        constraint = borrower_nft_vault.owner == offer.borrower.key()
    )]
    pub borrower_nft_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        address = sub_offer.offer_mint
    )]
    pub offer_mint: Box<Account<'info, Mint>>,
    #[account(init_if_needed,
        token::mint = offer_mint,
        token::authority = treasury_wallet,
        seeds = [TREASURY_VAULT_TAG, sub_offer.offer_mint.as_ref(), treasury_wallet.key().as_ref()],
        bump,
        payer = payer)]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: metaplex edition account
    pub edition: UncheckedAccount<'info>,

    #[account(
        seeds = [REWARD_VAULT_TAG],
        bump = global_state.reward_vault_bump,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(constraint = lender_user_stake_state.authority == lender.key())]
    pub lender_user_stake_state: Box<Account<'info, UserStateAccount>>,
    
    /// CHECK: Safe
    pub chainlink_program: AccountInfo<'info>,

    /// CHECK: Safe
    pub sol_feed: AccountInfo<'info>,

    /// CHECK: Safe
    pub usdc_feed: AccountInfo<'info>,

    /// CHECK: metaplex program
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
impl<'info> ClaimCollateral<'info> {
    fn into_transfer_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.borrower_nft_vault.to_account_info().clone(),
            to: self.lender_nft_vault.to_account_info().clone(),
            authority: self.offer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}

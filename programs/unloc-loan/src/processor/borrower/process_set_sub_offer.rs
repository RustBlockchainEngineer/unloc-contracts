use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::{constant::*, states::*, utils::*};
use std::str::FromStr;
use unloc_staking::states::FarmPoolUserAccount;

pub fn handle(
    ctx: Context<SetSubOffer>,
    offer_amount: u64,
    sub_offer_number: u64,
    loan_duration: u64,
    apr_numerator: u64,
) -> Result<()> {
    let mut profile_level = 0;
    if ctx.remaining_accounts.len() > 0 {
        let staking_user_info = ctx.remaining_accounts[0].to_account_info();
        let mut data: &[u8] = &staking_user_info.try_borrow_data()?;
        let staking_user = FarmPoolUserAccount::try_deserialize(&mut data)?;

        assert_pda(
            &[
                staking_user.pool.as_ref(),
                ctx.accounts.borrower.key().as_ref(),
            ],
            &unloc_staking::id(),
            &staking_user_info.key(),
        )?;

        profile_level = staking_user.profile_level;
    }

    set_sub_offer(
        ctx,
        offer_amount,
        sub_offer_number,
        loan_duration,
        apr_numerator,
        profile_level,
    )
}
pub fn set_sub_offer(
    ctx: Context<SetSubOffer>,
    offer_amount: u64,
    sub_offer_number: u64,
    loan_duration: u64,
    apr_numerator: u64,
    profile_level: u64,
) -> Result<()> {
    let available_sub_offer_count =
        DEFULT_SUB_OFFER_COUNT + profile_level * SUB_OFFER_COUNT_PER_LEVEL;
    let cur_available_sub_offer_count = ctx
        .accounts
        .offer
        .sub_offer_count
        .safe_sub(ctx.accounts.offer.start_sub_offer_num)?;
    require(cur_available_sub_offer_count < available_sub_offer_count, "cur_available_sub_offer_count")?;

    if is_zero_account(&ctx.accounts.sub_offer.to_account_info()) {
        ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Proposed);
        ctx.accounts.offer.sub_offer_count = ctx.accounts.offer.sub_offer_count.safe_add(1)?;
        ctx.accounts.sub_offer.offer = ctx.accounts.offer.key();
        ctx.accounts.sub_offer.nft_mint = ctx.accounts.offer.nft_mint;
        ctx.accounts.sub_offer.borrower = ctx.accounts.offer.borrower;
        ctx.accounts.sub_offer.creation_date = ctx.accounts.clock.unix_timestamp as u64;
        ctx.accounts.sub_offer.bump = *ctx.bumps.get("sub_offer").unwrap();
    }

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    // let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(
        // ctx.accounts.offer_mint.key() == unloc_mint || // featured offer is not implemented yet
        ctx.accounts.offer_mint.key() == usdc_mint || ctx.accounts.offer_mint.key() == wsol_mint,
        "offer_mint"
    )?;

    ctx.accounts.sub_offer.offer_mint = ctx.accounts.offer_mint.key();
    ctx.accounts.sub_offer.offer_mint_decimals = ctx.accounts.offer_mint.decimals;
    ctx.accounts.sub_offer.offer_amount = offer_amount;
    ctx.accounts.sub_offer.sub_offer_number = sub_offer_number;
    ctx.accounts.sub_offer.loan_duration = loan_duration;
    ctx.accounts.sub_offer.apr_numerator = apr_numerator;
    ctx.accounts.sub_offer.lender_has_claimed_rewards = false;
    ctx.accounts.sub_offer.borrower_has_claimed_rewards = false;

    Ok(())
}
#[derive(Accounts)]
#[instruction(
    offer_amount: u64,
    sub_offer_number: u64,
    loan_duration: u64,
    apr_numerator: u64
)]
pub struct SetSubOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
    seeds = [GLOBAL_STATE_TAG],
    bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut,
        seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
        bump = offer.bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    // init_if_needed is safe above solana-program v1.10.29
    #[account(
    init_if_needed,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer_number.to_be_bytes()],
    bump,
    payer = payer,
    constraint = sub_offer_number <= offer.sub_offer_count,
    space = std::mem::size_of::<SubOffer>() + 8
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    pub offer_mint: Box<Account<'info, Mint>>,
    /// CHECK: key only is used
    #[account(mut,
        constraint = global_state.treasury_wallet == treasury_wallet.key()
    )]
    pub treasury_wallet: AccountInfo<'info>,

    #[account(init_if_needed,
        token::mint = offer_mint,
        token::authority = treasury_wallet,
        seeds = [TREASURY_VAULT_TAG, offer_mint.key().as_ref(), treasury_wallet.key().as_ref()],
        bump,
        payer = payer)]
    pub treasury_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{constant::*, error::*, states::*, utils::*};
use std::str::FromStr;
use unloc_voting::constant::{VOTING_ITEM_TAG, VOTING_TAG};
use unloc_voting::states::{Voting, VotingItem};

pub fn handle(ctx: Context<AcceptOffer>) -> Result<()> {
    let mut total_point = 0;
    let mut collection_point = 0;
    if ctx.remaining_accounts.len() > 1 {
        let voting_info = ctx.remaining_accounts[0].to_account_info();
        let voting_item_info = ctx.remaining_accounts[1].to_account_info();
        let mut voting_data: &[u8] = &voting_info.try_borrow_data()?;
        let mut voting_item_data: &[u8] = &voting_item_info.try_borrow_data()?;
        let voting = Voting::try_deserialize(&mut voting_data)?;
        let voting_item = VotingItem::try_deserialize(&mut voting_item_data)?;

        assert_pda(
            &[VOTING_TAG, &voting.voting_number.to_be_bytes()],
            &unloc_voting::id(),
            &voting_info.key(),
        )?;
        assert_pda(
            &[
                VOTING_ITEM_TAG,
                voting_info.key().as_ref(),
                ctx.accounts.offer.collection.as_ref(),
            ],
            &unloc_voting::id(),
            &voting_item_info.key(),
        )?;

        total_point = voting.total_score;
        collection_point = voting_item.voting_score;
    }
    accept_offer(ctx, total_point, collection_point)
}
pub fn accept_offer(
    ctx: Context<AcceptOffer>,
    total_point: u128,
    collection_point: u128,
) -> Result<()> {
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
    ctx.accounts.sub_offer.update_reward_debt()?;

    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    let offer_mint = ctx.accounts.sub_offer.offer_mint;
    ctx.accounts
        .sub_offer
        .update_rps(&ctx.accounts.global_state, &offer_mint)?;

    require(ctx.accounts.offer.state == OfferState::get_state(OfferState::Proposed), "offer.state")?;
    require(ctx.accounts.sub_offer.state != SubOfferState::get_state(SubOfferState::Canceled), "sub_offer.state")?;

    if ctx.accounts.offer_mint.key() == wsol_mint {
        require(ctx.accounts.lender.lamports() >= ctx.accounts.sub_offer.offer_amount, "lender.lamports()")?;
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.lender.key,
                ctx.accounts.borrower.key,
                ctx.accounts.sub_offer.offer_amount,
            ),
            &[
                ctx.accounts.lender.to_account_info(),
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    } else if ctx.accounts.offer_mint.key() == usdc_mint {
        require(ctx.accounts.lender_offer_vault.amount >= ctx.accounts.sub_offer.offer_amount, "lender_offer_vault.amount")?;
        require(ctx.accounts.lender_offer_vault.owner == ctx.accounts.lender.key(), "lender_offer_vault.owner")?;
        require(ctx.accounts.lender_offer_vault.mint == ctx.accounts.offer_mint.key(), "lender_offer_vault.mint")?;
        require(ctx.accounts.borrower_offer_vault.owner == ctx.accounts.offer.borrower, "borrower_offer_vault.owner")?;
        require(ctx.accounts.borrower_offer_vault.mint == ctx.accounts.offer_mint.key(), "borrower_offer_vault.mint")?;
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_offer_vault.to_account_info(),
            to: ctx.accounts.borrower_offer_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, ctx.accounts.sub_offer.offer_amount)?;
    } else {
        return Err(error!(LoanError::NotAllowed));
    }

    ctx.accounts.offer.state = OfferState::get_state(OfferState::Accepted);
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Accepted);
    ctx.accounts.sub_offer.lender = ctx.accounts.lender.key();

    ctx.accounts.sub_offer.loan_started_time = ctx.accounts.clock.unix_timestamp as u64;

    ctx.accounts.sub_offer.total_point = total_point;
    ctx.accounts.sub_offer.collection_point = collection_point;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,

    /// CHECK: we use this account for owner
    #[account(mut)]
    pub borrower: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(mut,
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump = offer.bump,
    )]
    pub offer: Box<Account<'info, Offer>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump = sub_offer.bump,
    )]
    pub sub_offer: Box<Account<'info, SubOffer>>,

    #[account(mut,
        constraint = sub_offer.offer_mint == offer_mint.key()
    )]
    pub offer_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,

    /// CHECK: Safe
    pub chainlink_program: AccountInfo<'info>,

    /// CHECK: Safe
    pub sol_feed: AccountInfo<'info>,

    /// CHECK: Safe
    pub usdc_feed: AccountInfo<'info>,

    #[account(
        seeds = [REWARD_VAULT_TAG],
        bump = global_state.reward_vault_bump,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

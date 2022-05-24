use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};
use anchor_lang::solana_program::{
    system_instruction,
    program::{
        invoke, 
    },
};
use unloc_voting::constant::{VOTING_TAG, VOTING_ITEM_TAG};
use unloc_voting::states::{Voting, VotingItem};

use crate::{
    //error::*,
    constant::*,
    utils::*,
    states::*,
};
use std::str::FromStr;
pub fn process_accept_offer(ctx: Context<AcceptOffer>) -> Result<()> { 
    require(ctx.accounts.sub_offer.sub_offer_number >= ctx.accounts.offer.start_sub_offer_num)?;
    require(ctx.accounts.offer.state == OfferState::get_state(OfferState::Proposed))?;
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

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    ctx.accounts.user_reward.lender = ctx.accounts.lender.key();
    ctx.accounts.user_reward.borrower = ctx.accounts.borrower.key();
    ctx.accounts.user_reward.sub_offer = ctx.accounts.sub_offer.key();
    ctx.accounts.user_reward.loan_mint = ctx.accounts.offer_mint.key();
    ctx.accounts.user_reward.loan_mint_decimals = ctx.accounts.offer_mint.decimals;
    ctx.accounts.user_reward.start_time = current_time;
    ctx.accounts.user_reward.lender_last_claimed_time = current_time;
    ctx.accounts.user_reward.borrower_last_claimed_time = current_time;
    ctx.accounts.user_reward.max_duration = ctx.accounts.sub_offer.loan_duration;
    ctx.accounts.user_reward.end_time = ctx.accounts.sub_offer.loan_duration.checked_add(current_time).unwrap();
    ctx.accounts.user_reward.loan_amount = ctx.accounts.sub_offer.offer_amount;
    ctx.accounts.user_reward.lender_claimed_amount = 0;
    ctx.accounts.user_reward.borrower_claimed_amount = 0;
    ctx.accounts.user_reward.collection = ctx.accounts.offer.collection;
    ctx.accounts.user_reward.total_point = ctx.accounts.voting.total_score;
    ctx.accounts.user_reward.collection_point = ctx.accounts.voting_item.voting_score;
    

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
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(mut, 
    seeds = [OFFER_TAG, borrower.key().as_ref(), offer.nft_mint.as_ref()],
    bump,
    )]
    pub offer:Box<Account<'info, Offer>>,
    
    #[account(
        mut,
        seeds = [VOTING_TAG, &global_state.current_voting_num.to_be_bytes()],
        seeds::program = global_state.voting_pid,
        bump,
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        mut,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), offer.collection.as_ref()],
        seeds::program = global_state.voting_pid,
        bump,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,

    #[account(mut,
    seeds = [SUB_OFFER_TAG, offer.key().as_ref(), &sub_offer.sub_offer_number.to_be_bytes()],
    bump,
    )]
    pub sub_offer:Box<Account<'info, SubOffer>>,

    #[account(
        init,
        seeds = [LENDER_REWARD_TAG, lender.key().as_ref(), borrower.key().as_ref(), sub_offer.key().as_ref()],
        bump,
        payer = lender,
        space = std::mem::size_of::<LenderReward>() + 8
        )]
    pub user_reward:Box<Account<'info, LenderReward>>,

    #[account(mut,
        constraint = sub_offer.offer_mint == offer_mint.key()
    )]
    pub offer_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub borrower_offer_vault: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub lender_offer_vault: Box<Account<'info, TokenAccount>>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

use anchor_lang::prelude::*;

/// constant
pub mod constant;
/// error
pub mod error;
/// events
pub mod events;
///processor
pub mod processor;
/// states
pub mod states;
/// events
pub mod utils;

use crate::processor::*;

declare_id!("TkpSRsB8yB2qRETXLuPxuZ6Fkg2vuJnmfsQiJLfVpmG");

#[program]
pub mod unloc_loan {
    use super::*;

    // admin
    pub fn set_global_state(
        ctx: Context<SetGlobalState>,
        accrued_interest_numerator: u64,
        denominator: u64,
        min_repaid_numerator: u64,
        apr_numerator: u64,
        expire_loan_duration: u64,
        reward_rate: u64,
        lender_rewards_percentage: u64,
        new_super_owner: Pubkey,
        treasury_wallet: Pubkey,
    ) -> Result<()> {
        process_set_global_state::handle(
            ctx,
            accrued_interest_numerator,
            denominator,
            min_repaid_numerator,
            apr_numerator,
            expire_loan_duration,
            reward_rate,
            lender_rewards_percentage,
            new_super_owner,
            treasury_wallet,
        )
    }
    pub fn set_staking_pool(
        ctx: Context<SetStakingPool>,
        unloc_staking_pool_id: Pubkey,
    ) -> Result<()> {
        process_set_staking_pool::handle(ctx, unloc_staking_pool_id)
    }
    pub fn set_voting(ctx: Context<SetVoting>, voting: Pubkey) -> Result<()> {
        process_set_voting::handle(ctx, voting)
    }
    pub fn deposit_rewards(ctx: Context<DepositRewards>, amount: u64) -> Result<()> {
        process_deposit_rewards::handle(ctx, amount)
    }
    pub fn withdraw_rewards(ctx: Context<WithdrawRewards>, amount: u64) -> Result<()> {
        process_withdraw_rewards::handle(ctx, amount)
    }
    pub fn claim_expired_collateral(ctx: Context<ClaimExpiredCollateral>) -> Result<()> {
        process_claim_expired_collateral::handle(ctx)
    }

    // borrower
    pub fn create_offer(ctx: Context<CreateOffer>) -> Result<()> {
        process_create_offer::handle(ctx)
    }
    pub fn create_sub_offer(
        ctx: Context<CreateSubOffer>,
        offer_amount: u64,
        sub_offer_number: u64,
        loan_duration: u64,
        apr_numerator: u64,
    ) -> Result<()> {
        process_create_sub_offer::handle(
            ctx,
            offer_amount,
            sub_offer_number,
            loan_duration,
            apr_numerator,
        )
    }
    pub fn update_sub_offer(
        ctx: Context<UpdateSubOffer>,
        offer_amount: u64,
        sub_offer_number: u64,
        loan_duration: u64,
        apr_numerator: u64,
    ) -> Result<()> {
        process_update_sub_offer::handle(
            ctx,
            offer_amount,
            sub_offer_number,
            loan_duration,
            apr_numerator,
        )
    }
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        process_repay_loan::handle(ctx)
    }
    pub fn delete_offer(ctx: Context<DeleteOffer>) -> Result<()> {
        process_delete_offer::handle(ctx)
    }
    pub fn delete_sub_offer(ctx: Context<DeleteSubOffer>) -> Result<()> {
        process_delete_sub_offer::handle(ctx)
    }

    // lender
    pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> {
        process_accept_offer::handle(ctx)
    }
    pub fn claim_collateral(ctx: Context<ClaimCollateral>) -> Result<()> {
        process_claim_collateral::handle(ctx)
    }

    // borrower
    pub fn claim_borrower_rewards(ctx: Context<ClaimBorrowerRewards>) -> Result<()> {
        process_claim_borrower_rewards::handle(ctx)
    }

    // borrower & lender
    pub fn claim_lender_rewards(ctx: Context<ClaimLenderRewards>) -> Result<()> {
        process_claim_lender_rewards::handle(ctx)
    }
}

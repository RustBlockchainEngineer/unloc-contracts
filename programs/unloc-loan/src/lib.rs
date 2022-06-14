use anchor_lang::prelude::*;

/// states
pub mod states;
///processor
pub mod processor;
/// error
pub mod error;
/// constant
pub mod constant;
/// events
pub mod events;
/// events
pub mod utils;

use crate::{
    processor::*,
};

declare_id!("6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh");

#[program]
pub mod unloc_loan {
    use super::*;
    
    pub fn set_global_state(ctx: Context<SetGlobalState>, accrued_interest_numerator: u64, denominator: u64, apr_numerator: u64, expire_loan_duration: u64, reward_rate: u64, lender_rewards_percentage: u64) -> Result<()> { 
        process_set_global_state::handle(ctx, accrued_interest_numerator, denominator, apr_numerator, expire_loan_duration, reward_rate,  lender_rewards_percentage)
    }
    pub fn deposit_rewards(ctx: Context<DepositRewards>, amount: u64) -> Result<()> { 
        process_deposit_rewards::handle(ctx, amount) 
    }
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { 
        process_claim_rewards::handle(ctx)
    }
    // create offer & update offer
    pub fn set_offer(ctx: Context<SetOffer>) -> Result<()> { 
        process_set_offer::handle(ctx) 
    }
    // pub fn set_sub_offer_by_staking(ctx: Context<SetSubOfferByStaking>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
    //     process_set_sub_offer_by_staking::handle(ctx, offer_amount, sub_offer_number, loan_duration, min_repaid_numerator, apr_numerator) 
    // }
    pub fn set_sub_offer(ctx: Context<SetSubOffer>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
        process_set_sub_offer::handle(ctx, offer_amount, sub_offer_number, loan_duration, min_repaid_numerator, apr_numerator) 
    }
    pub fn cancel_offer(ctx: Context<CancelOffer>) -> Result<()> { 
        process_cancel_offer::handle(ctx) 
    }
    pub fn cancel_sub_offer(ctx: Context<CancelSubOffer>, ) -> Result<()> { 
        process_cancel_sub_offer::handle(ctx) 
    }
    // pub fn accept_offer_by_voting(ctx: Context<AcceptOfferByVoting>) -> Result<()> { 
    //     process_accept_offer_by_voting::handle(ctx) 
    // }
    pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> { 
        process_accept_offer::handle(ctx) 
    }
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> { 
        process_repay_loan::handle(ctx) 
    }
    pub fn claim_collateral(ctx: Context<ClaimCollateral>) -> Result<()> { 
        process_claim_collateral::handle(ctx) 
    }
    pub fn claim_expired_collateral(ctx: Context<ClaimExpiredCollateral>) -> Result<()> { 
        process_claim_expired_collateral::handle(ctx) 
    }
}
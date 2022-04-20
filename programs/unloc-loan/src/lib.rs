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

declare_id!("3LhSA4Tdx5o17UTwynCMZJ8XERsU2nh5P3UwmTDSuGQ7");

#[program]
pub mod unloc_nft_loan {
    use super::*;
    
    pub fn set_global_state(ctx: Context<SetGlobalState>, accrued_interest_numerator: u64, denominator: u64, apr_numerator: u64, reward_per_sol: u64, reward_per_usdc: u64) -> Result<()> { 
        process_set_global_state(ctx, accrued_interest_numerator, denominator, apr_numerator, reward_per_sol, reward_per_usdc)
    }
    pub fn deposit_rewards(ctx: Context<DepositRewards>, amount: u64) -> Result<()> { 
        process_deposit_rewards(ctx, amount) 
    }
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { 
        process_claim_rewards(ctx)
    }
    // create offer & update offer
    pub fn set_offer(ctx: Context<SetOffer>) -> Result<()> { 
        process_set_offer(ctx) 
    }
    pub fn set_sub_offer(ctx: Context<SetSubOffer>, offer_amount: u64, sub_offer_number: u64, loan_duration: u64, min_repaid_numerator: u64, apr_numerator: u64) -> Result<()> { 
        process_set_sub_offer(ctx, offer_amount, sub_offer_number, loan_duration, min_repaid_numerator, apr_numerator) 
    }
    pub fn cancel_offer(ctx: Context<CancelOffer>) -> Result<()> { 
        process_cancel_offer(ctx) 
    }
    pub fn cancel_sub_offer(ctx: Context<CancelSubOffer>, ) -> Result<()> { 
        process_cancel_sub_offer(ctx) 
    }
    pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> { 
        process_accept_offer(ctx) 
    }
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> { 
        process_repay_loan(ctx) 
    }
    pub fn claim_collateral(ctx: Context<ClaimCollateral>) -> Result<()> { 
        process_claim_collateral(ctx) 
    }
}
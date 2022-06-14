use std::convert::TryInto;

use anchor_lang::prelude::*;
use chainlink_solana as chainlink;
use crate::{
    utils::*, 
    constant::*,
    error::*
};
use std::str::FromStr;
#[account]
#[derive(Default)]
pub struct GlobalState {
    pub super_owner: Pubkey,

    pub treasury_wallet: Pubkey,
    pub accrued_interest_numerator: u64,
    pub apr_numerator: u64,
    pub expire_loan_duration: u64,
    pub denominator: u64,
    
    pub reward_vault: Pubkey,
    pub reward_rate: u64, // UNLOC token amount per second
    pub tvl_sol: u64,
    pub tvl_usdc: u64,
    pub funded_amount: u64,
    pub distributed_amount: u64,
    pub last_distributed_time: u64,
    pub rps_sol: u128, // reward per share for SOL
    pub rps_usdc: u128, // reward per share for USDC
    
    // borrower rewards percentage is the rest of lender rewards percentage
    pub lender_rewards_percentage: u64,
    
    // UNLOC staking pool info
    pub unloc_staking_pid: Pubkey,
    pub unloc_staking_pool_id: Pubkey,

    // current voting info
    pub voting_pid: Pubkey,
    pub voting: Pubkey,

    pub reserved: [u128; 15],
}
impl GlobalState {
    pub fn distribute<'info>(&mut self, reward_vault_amount: u64, current_time: u64, chainlink_program: &AccountInfo<'info>, sol_feed: &AccountInfo<'info>, usdc_feed: &AccountInfo<'info>) -> Result<()> {
        // check chainlink ids
        let sol_feed_key = Pubkey::from_str(CHAINLINK_SOL_FEED).unwrap();
        let usdc_feed_key = Pubkey::from_str(CHAINLINK_USDC_FEED).unwrap();
        require(chainlink_program.key() == chainlink::id())?;
        require(sol_feed.key() == sol_feed_key)?;
        require(usdc_feed.key() == usdc_feed_key)?;

        let sol_price = get_chainlink_price(sol_feed, &chainlink_program.clone())?;
        let usdc_price = get_chainlink_price(usdc_feed, &chainlink_program.clone())?;
        self.distribute_rewards(reward_vault_amount, current_time, sol_price, usdc_price)
    }
    pub fn distribute_rewards(&mut self, reward_vault_amount: u64, current_time: u64, sol_price: i128, usdc_price: i128) -> Result<()> {
        let delta_duration = current_time.safe_sub(self.last_distributed_time)?;
        let remained_rewards = self.funded_amount.safe_sub(self.distributed_amount)?;

        require!(remained_rewards <= reward_vault_amount, LoanError::NotAllowed);

        let reward_rate = self.reward_rate;
        let mut delta_rewards = reward_rate.safe_mul(delta_duration)?;

        if remained_rewards < delta_rewards {
            delta_rewards = remained_rewards;
        }

        let tvl_sol_to_usd = (sol_price as u128).safe_mul(self.tvl_sol as u128)?;
        let tvl_usdc_to_usd = (usdc_price as u128).safe_mul(self.tvl_usdc as u128)?.safe_mul(DIFF_SOL_USDC_DECIMALS)?;
        let tvl_usd = tvl_sol_to_usd.safe_add(tvl_usdc_to_usd)?;

        self.rps_sol = self.rps_sol
            .safe_add(
                (delta_rewards as u128)
                .safe_mul(SHARE_PRECISION)?
                .safe_mul(tvl_sol_to_usd)?
                .safe_div(tvl_usd)?
            )?;
        self.rps_usdc = self.rps_usdc
            .safe_add(
                (delta_rewards as u128)
                .safe_mul(SHARE_PRECISION)?
                .safe_mul(tvl_usdc_to_usd)?
                .safe_div(tvl_usd)?
            )?;
        self.distributed_amount = self.distributed_amount.safe_add(delta_rewards)?;
        self.last_distributed_time = current_time;
        Ok(())
    }
    pub fn withdrawable_amount(&self, reward_vault_amount: u64) -> Result<u64> {
        let withrawable_amount = self.funded_amount.safe_sub(self.distributed_amount)?;
        if withrawable_amount > reward_vault_amount {Ok(0)} else {Ok(withrawable_amount)}
    }
}

#[account]
#[derive(Default)]
pub struct Offer {
    pub borrower: Pubkey,

    pub nft_mint: Pubkey,
    pub collection: Pubkey,
    pub state: u8,
    pub sub_offer_count: u64,
    pub start_sub_offer_num: u64,
    pub creation_date: u64,

    pub reserved: [u128; 7],
}

#[account]
#[derive(Default)]
pub struct SubOffer {
    pub borrower: Pubkey,
    pub nft_mint: Pubkey,
    pub offer_mint: Pubkey,
    pub offer_mint_decimals: u8,
    pub state: u8,
    
    pub offer: Pubkey,
    pub sub_offer_number: u64,
    
    pub lender: Pubkey,
    pub offer_vault: Pubkey,
    pub offer_amount: u64,
    pub repaid_amount: u64,
    pub lender_claimed_amount: u64,
    pub borrower_claimed_amount: u64,
    pub loan_started_time: u64,
    pub loan_ended_time: u64,
    pub loan_duration: u64,
    pub min_repaid_numerator: u64,
    pub apr_numerator: u64,
    pub creation_date: u64,

    // UNLOC rewards
    pub total_point: u128,
    pub collection_point: u128,
    pub rps: u128,
    pub reward_debt: u128,

    pub reserved: [u128; 7],
}
impl SubOffer {
    pub fn virtual_rewards(&self) -> Result<u128> {
        self.rps
            .safe_mul(self.offer_amount as u128)
    }
    pub fn pending_rewards(&self) -> Result<u64> {
        let pending = self.virtual_rewards()?
            .safe_sub(self.reward_debt)?
            .safe_div(SHARE_PRECISION)?
            .safe_div(10u128.pow(self.offer_mint_decimals as u32))?;
        Ok(pending.try_into().unwrap_or(0))
    }
    pub fn update_rps(&mut self, global_state: &GlobalState, reward_mint: &Pubkey) -> Result<()> {
        let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
        let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
        if wsol_mint == *reward_mint {
            self.rps = global_state.rps_sol;
        }
        else if usdc_mint == *reward_mint {
            self.rps = global_state.rps_usdc;
        } else {
            return Err(error!(LoanError::NotAllowed));
        }
        
        Ok(())
    }
    pub fn update_reward_debt(&mut self) -> Result<()> {
        self.reward_debt = self.virtual_rewards()?;
        Ok(())
    }
}
pub enum OfferState {
    Proposed,
    Accepted,
    Expired,
    Fulfilled,
    NFTClaimed,
    Canceled
}
impl OfferState {
    pub fn get_state(state: OfferState) -> u8 {
        state as u8
    }
}
pub enum SubOfferState {
    Proposed,
    Accepted,
    Expired,
    Fulfilled,
    LoanPaymentClaimed,
    Canceled,
    NFTClaimed
}

impl SubOfferState {
    pub fn get_state(state: SubOfferState) -> u8 {
        state as u8
    }
}

use anchor_lang::prelude::*;


#[account]
#[derive(Default)]
pub struct GlobalState {
    pub super_owner: Pubkey,

    pub treasury_wallet: Pubkey,
    pub accrued_interest_numerator: u64,
    pub apr_numerator: u64,
    pub denominator: u64,
    
    pub reward_per_sol: u64,
    pub reward_per_usdc: u64,
    pub unloc_staking_pid: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Offer {
    pub borrower: Pubkey,

    pub nft_mint: Pubkey,
    pub nft_vault: Pubkey,
    pub state: u8,
    pub sub_offer_count: u64,
    pub start_sub_offer_num: u64,
}

#[account]
#[derive(Default)]
pub struct SubOffer {
    pub borrower: Pubkey,
    pub nft_mint: Pubkey,
    pub offer_mint: Pubkey,
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


#[account]
#[derive(Default)]
pub struct LenderReward {
    pub lender: Pubkey,
    pub sub_offer: Pubkey,
    pub loan_mint: Pubkey,
    pub loan_mint_decimals: u8,

    pub start_time: u64,
    pub end_time: u64,
    pub last_claimed_time: u64,
    pub max_duration: u64,
    pub loan_amount: u64,
    pub claimed_amount: u64,
}

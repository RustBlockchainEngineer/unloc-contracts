use anchor_lang::prelude::*;
use crate::{
    error::*,
    states::*,
};
use std::convert::TryInto;
pub fn is_zero_account(account_info:&AccountInfo)->bool{
    let account_data: &[u8] = &account_info.data.borrow();
    let len = account_data.len();
    let mut is_zero = true;
    for i in 0..len-1 {
        if account_data[i] != 0 {
            is_zero = false;
        }
    }
    is_zero
}

pub fn assert_owner(cur_owner: Pubkey, given_owner: Pubkey) -> Result<()> {
    if cur_owner != given_owner {
        return Err(error!(LoanError::InvalidOwner));
    }
    Ok(())
}

pub fn require(flag: bool) -> Result<()> {
    if !flag {
        return Err(error!(LoanError::NotAllowed));
    }
    Ok(())
}


pub fn bump(seeds:&[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}

pub fn assert_repaid_loan(sub_offer: &SubOffer) -> Result<()> {
    if sub_offer.repaid_amount == 0 {
        return Err(error!(LoanError::InvalidAmount));
    }
    Ok(())
}

pub fn assert_unclaimed_loan_payment(sub_offer: &SubOffer) -> Result<()> {
    if sub_offer.lender_claimed_amount > 0 {
        return Err(error!(LoanError::NotAllowed));
    }
    Ok(())
}

pub fn assert_lender_claimable_nft(sub_offer: &SubOffer, current_time: u64) -> Result<()> {

    if sub_offer.loan_duration + sub_offer.loan_started_time >= current_time {
        return Err(error!(LoanError::NotAllowed));
    }
    Ok(())
}

pub fn assert_borrower_claimable_nft(sub_offer: &SubOffer, current_time: u64) -> Result<()> {

    if sub_offer.loan_duration + sub_offer.loan_started_time < current_time {
        return Err(error!(LoanError::NotAllowed));
    }
    Ok(())
}
pub fn calc_fee(total: u64, fee_percent: u64, denominator: u64) -> Result<u64> {
    let _total: u128 = total as u128;
    let _fee_percent: u128 = fee_percent as u128;
    let _denominator: u128 = denominator as u128;

    if _denominator == 0 {
        return Err(error!(LoanError::InvalidDenominator));
    }
    let result = _total * _fee_percent / _denominator;
    Ok(result.try_into().unwrap())
}
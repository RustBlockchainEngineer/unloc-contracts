use crate::{error::*, states::*};
use anchor_lang::prelude::*;
use chainlink_solana as chainlink;
use std::convert::TryInto;

pub fn is_zero_account(account_info: &AccountInfo) -> bool {
    let account_data: &[u8] = &account_info.data.borrow();
    let len = account_data.len();
    let mut is_zero = true;
    for i in 0..len - 1 {
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

pub fn require(flag: bool, msg: &str) -> Result<()> {
    if !flag {
        msg!("error: {}", msg);
        return Err(error!(LoanError::NotAllowed));
    }
    Ok(())
}

pub fn bump(seeds: &[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}
pub fn assert_pda(seeds: &[&[u8]], program_id: &Pubkey, pda: &Pubkey) -> Result<()> {
    let (found_key, _bump) = Pubkey::find_program_address(seeds, program_id);
    if found_key != *pda {
        return Err(error!(LoanError::InvalidProgramAddress));
    }
    Ok(())
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
    calc_fee_u128(total, fee_percent as u128, denominator as u128)
}

pub fn calc_fee_u128(total: u64, fee_percent: u128, denominator: u128) -> Result<u64> {
    let _total: u128 = total as u128;
    let _fee_percent: u128 = fee_percent;
    let _denominator: u128 = denominator;

    if _denominator == 0 {
        return Err(error!(LoanError::InvalidDenominator));
    }
    let result = _total.safe_mul(_fee_percent)?.safe_div(_denominator)?;
    Ok(result.try_into().unwrap())
}
pub fn get_chainlink_price<'info>(
    feed_account: &AccountInfo<'info>,
    chainlink_program: &AccountInfo<'info>,
) -> Result<i128> {
    let round = chainlink::latest_round_data(chainlink_program.clone(), feed_account.clone())?;
    Ok(round.answer)
}
pub trait SafeCalc<T> {
    fn safe_add(&self, num: T) -> Result<T>;
    fn safe_sub(&self, num: T) -> Result<T>;
    fn safe_mul(&self, num: T) -> Result<T>;
    fn safe_div(&self, num: T) -> Result<T>;
}
impl SafeCalc<u32> for u32 {
    fn safe_add(&self, num: u32) -> Result<u32> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u32) -> Result<u32> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u32) -> Result<u32> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u32) -> Result<u32> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u64> for u64 {
    fn safe_add(&self, num: u64) -> Result<u64> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u64) -> Result<u64> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u64) -> Result<u64> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u64) -> Result<u64> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u128> for u128 {
    fn safe_add(&self, num: u128) -> Result<u128> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u128) -> Result<u128> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u128) -> Result<u128> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u128) -> Result<u128> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(LoanError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}

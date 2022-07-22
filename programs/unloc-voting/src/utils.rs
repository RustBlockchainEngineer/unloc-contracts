use crate::error::*;
use anchor_lang::prelude::*;

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
        return Err(error!(VotingError::InvalidOwner));
    }
    Ok(())
}

pub fn require(flag: bool) -> Result<()> {
    if !flag {
        return Err(error!(VotingError::NotAllowed));
    }
    Ok(())
}

pub fn bump(seeds: &[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
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
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u32) -> Result<u32> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u32) -> Result<u32> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u32) -> Result<u32> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u64> for u64 {
    fn safe_add(&self, num: u64) -> Result<u64> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u64) -> Result<u64> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u64) -> Result<u64> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u64) -> Result<u64> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u128> for u128 {
    fn safe_add(&self, num: u128) -> Result<u128> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u128) -> Result<u128> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u128) -> Result<u128> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u128) -> Result<u128> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}

impl SafeCalc<i64> for i64 {
    fn safe_add(&self, num: i64) -> Result<i64> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: i64) -> Result<i64> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: i64) -> Result<i64> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: i64) -> Result<i64> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(VotingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}

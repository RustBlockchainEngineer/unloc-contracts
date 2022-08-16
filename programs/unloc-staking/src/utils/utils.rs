use crate::error::*;
use anchor_lang::prelude::*;
use std::convert::TryInto;

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
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u32) -> Result<u32> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u32) -> Result<u32> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u32) -> Result<u32> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u64> for u64 {
    fn safe_add(&self, num: u64) -> Result<u64> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u64) -> Result<u64> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u64) -> Result<u64> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u64) -> Result<u64> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}
impl SafeCalc<u128> for u128 {
    fn safe_add(&self, num: u128) -> Result<u128> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: u128) -> Result<u128> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: u128) -> Result<u128> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: u128) -> Result<u128> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}

impl SafeCalc<i64> for i64 {
    fn safe_add(&self, num: i64) -> Result<i64> {
        let result = self.checked_add(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_sub(&self, num: i64) -> Result<i64> {
        let result = self.checked_sub(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_mul(&self, num: i64) -> Result<i64> {
        let result = self.checked_mul(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
    fn safe_div(&self, num: i64) -> Result<i64> {
        let result = self.checked_div(num);
        if result.is_none() {
            return Err(error!(StakingError::MathOverflow));
        }
        Ok(result.unwrap())
    }
}

pub fn calc_fee(total: u64, fee_percent: u64, denominator: u64) -> Result<u64> {
    let _total: u128 = total as u128;
    let _fee_percent: u128 = fee_percent as u128;
    let _denominator: u128 = denominator as u128;

    if _denominator == 0 {
        return Err(error!(StakingError::InvalidDenominator));
    }
    let result = _total.safe_mul(_fee_percent)?.safe_div(_denominator)?;
    Ok(result.try_into().unwrap())
}
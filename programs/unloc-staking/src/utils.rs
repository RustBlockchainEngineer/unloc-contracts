use crate::error::*;
use anchor_lang::prelude::*;
use std::convert::TryInto;

// pub const DEVNET_MODE: bool = true;
// pub const INITIAL_OWNER: &str = "HV2t9B2oxdtkwbZrWj1vjZ2q3g4SH5rasGw8WohBFbvH";
// pub const ACC_PRECISION: u128 = 100_000_000_000;
// pub const MAX_LEVEL: usize = 10;
// pub const MAX_PROFILE_LEVEL: usize = 5;
// pub const UNLOC_MINT: &str = if DEVNET_MODE {
//     "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
// } else {
//     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
// };

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

#[event]
pub struct RateChanged {
    pub token_per_second: u64,
}

#[event]
pub struct EarlyUnlockFeeChanged {
    pub early_unlock_fee: u64,
}
#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub mint: Pubkey,
}
#[event]
pub struct PoolLockDurationChanged {
    pub pool: Pubkey,
    pub lock_duration: i64,
}
#[event]
pub struct PoolAmountMultiplerChanged {
    pub pool: Pubkey,
    pub amount_multipler: u64,
}
#[event]
pub struct PoolPointChanged {
    pub pool: Pubkey,
    pub point: u64,
}
#[event]
pub struct UserCreated {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub authority: Pubkey,
}
#[event]
pub struct UserStaked {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub authority: Pubkey,
    pub amount: u64,
    pub lock_duration: i64,
}
#[event]
pub struct UserUnstaked {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub authority: Pubkey,
    pub amount: u64,
}
#[event]
pub struct UserHarvested {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub authority: Pubkey,
    pub amount: u64,
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
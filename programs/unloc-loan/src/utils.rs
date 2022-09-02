use crate::{error::*, states::*, constant::{REDEMPTION_RESET}};
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

pub fn authorize_account(flag: bool, msg: &str) -> Result<()> {
    if !flag {
        msg!("error: {}", msg);
        return Err(error!(LoanError::Unauthorized));
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

pub fn convert_unix_to_utc(mut unix_time: i64) -> Result<UtcTime> {
    /* calculate minutes */
    let mut minutes = unix_time / 60;
    unix_time -= minutes * 60;
    /* calculate hours */
    let mut hours = minutes / 60;
    minutes -= hours * 60;
    /* calculate days */
    let mut days = hours / 24;
    hours -= days * 24;

     /* Unix time starts in 1970 on a Thursday */
    let mut year: i64 = 1970;
    //let mut day_of_week: i64 = 4;
    let mut month: i64 = 0;
    let mut days_in_current_month: i64 = 0;

    loop {
        let mut leap_year: bool = false;
        let days_in_year: i64;
        if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) { leap_year = true };
        if leap_year { days_in_year = 366 } else { days_in_year = 365 };
        if days >= days_in_year {
            //if leap_year { day_of_week += 2 } else { day_of_week += 1 };
            days -= days_in_year;
            // if day_of_week >= 7 {
            //     day_of_week -= 7;
            // }
            year += 1;
        }
        else {
            //tm->tm_yday = days;
            //day_of_week += days;
            //day_of_week %= 7;

            /* calculate the month and day */
            let days_in_month = vec![31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            for i in 0..12 {
                let mut dim = days_in_month[i];
                /* add a day to feburary if this is a leap year */
                if i == 1 && leap_year {
                    dim += 1;
                }

                if days >= dim {
                    days -= dim;
                }
                else {
                    month = i as i64;
                    days_in_current_month = dim as i64;
                    month += 1;
                    break;
                }
            }
            break;
        }
    }

    let current_time = UtcTime {
        days_in_month: days_in_current_month,
        sec: unix_time,
        min: minutes,
        hr: hours,
        day: days + 1,
        month: month,
        year: year
    };

    Ok(current_time)
}

pub fn validate_redeem_time(last_redemption: i64, current_unix: i64) -> Result<bool> {
    let is_valid_redemption: bool;
    let last_redemption_utc = convert_unix_to_utc(last_redemption).unwrap();
    let current_utc = convert_unix_to_utc(current_unix).unwrap();

    msg!("Last redemption utc: {:?}", last_redemption_utc);
    msg!("Current time utc: {:?}", current_utc);
    if last_redemption_utc.year < current_utc.year {
        if current_utc.month == 1 && last_redemption_utc.month == 12 {
            if current_utc.day == 1 && last_redemption_utc.day == last_redemption_utc.days_in_month {
                if last_redemption_utc.hr < REDEMPTION_RESET || current_utc.hr >= REDEMPTION_RESET {
                    is_valid_redemption = true;
                } else {
                    is_valid_redemption = false;
                }
            } else {
                is_valid_redemption = true;
            }
        } else {
            is_valid_redemption = true;
        }
    }
    else if last_redemption_utc.year == current_utc.year && last_redemption_utc.month < current_utc.month {
        if current_utc.month - last_redemption_utc.month == 1 {
            if current_utc.day == 1 && last_redemption_utc.day == last_redemption_utc.days_in_month {
                if last_redemption_utc.hr < REDEMPTION_RESET || current_utc.hr >= REDEMPTION_RESET {
                    is_valid_redemption = true;
                } else {
                    is_valid_redemption = false;
                }
            } else {
                is_valid_redemption = true;
            }
        } else {
            is_valid_redemption = true;
        }
    }
    else if last_redemption_utc.month == current_utc.month && last_redemption_utc.day < current_utc.day {
        if current_utc.day - last_redemption_utc.day == 1 {
            if last_redemption_utc.hr < REDEMPTION_RESET || current_utc.hr >= REDEMPTION_RESET {
                is_valid_redemption = true;
            } else {
                is_valid_redemption = false;
            }
        } else {
            is_valid_redemption = true;
        }
    }
    else if last_redemption_utc.day == current_utc.day && last_redemption_utc.hr < REDEMPTION_RESET && current_utc.hr >= REDEMPTION_RESET {
        is_valid_redemption = true;
    }
    else {
        is_valid_redemption = false;
    }

    Ok(is_valid_redemption)
    
}

#[derive(Debug)]
pub struct UtcTime {
    days_in_month: i64,
    sec: i64,
    min: i64,
    hr: i64,
    day: i64,
    month: i64,
    year: i64
}
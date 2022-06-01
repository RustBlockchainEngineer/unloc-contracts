use anchor_lang::prelude::*;
use crate::{
    error::*,
    // states::*,
};
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


pub fn bump(seeds:&[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}

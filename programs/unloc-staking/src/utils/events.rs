use anchor_lang::prelude::*;

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
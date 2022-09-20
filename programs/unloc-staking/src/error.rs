use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Invalid Owner")]
    InvalidOwner,
    #[msg("Over staked amount")]
    UnstakeOverAmount,
    #[msg("Under locked")]
    UnderLocked,
    #[msg("Pool is working")]
    WorkingPool,
    #[msg("Invalid Lock Duration")]
    InvalidLockDuration,
    #[msg("Invalid SEQ")]
    InvalidSEQ,
    #[msg("InvalidDenominator")]
    InvalidDenominator,
    #[msg("Overlfow Max Profile Level")]
    OverflowMaxProfileLevel,
    #[msg("Wrong Mint")]
    InvalidMint,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("The provided program data is incorrect.")]
    InvalidProgramData,
    #[msg("The provided program upgrade authority is incorrect.")]
    InvalidProgramUpgradeAuthority,
}

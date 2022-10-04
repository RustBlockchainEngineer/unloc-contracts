use anchor_lang::prelude::*;

#[error_code]
pub enum LoanError {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("AlreadyInUse")]
    AlreadyInUse,
    #[msg("InvalidProgramAddress")]
    InvalidProgramAddress,
    #[msg("InvalidState")]
    InvalidState,
    #[msg("InvalidOwner")]
    InvalidOwner,
    #[msg("NotAllowed")]
    NotAllowed,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("InvalidAccountInput")]
    InvalidAccountInput,
    #[msg("InvalidPubkey")]
    InvalidPubkey,
    #[msg("InvalidMint")]
    InvalidMint,
    #[msg("InvalidAmount")]
    InvalidAmount,
    #[msg("InvalidDenominator")]
    InvalidDenominator,
    #[msg("Must wait until current cooldown period resets before redeeming liquidity mining rewards again.")]
    CooldownPeriod,
    #[msg("The provided program data is incorrect.")]
    InvalidProgramData,
    #[msg("The provided program upgrade authority is incorrect.")]
    InvalidProgramUpgradeAuthority,
}

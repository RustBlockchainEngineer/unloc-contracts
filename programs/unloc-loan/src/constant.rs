use anchor_lang::prelude::*;


const DEVNET_MODE:bool = {
    #[cfg(feature = "devnet")]
    {
        true
    }
    #[cfg(not(feature = "devnet"))]
    {
        false
    }
};

#[constant]
pub const GLOBAL_STATE_SEED:&str = "GLOBAL_STATE_SEED";
pub const GLOBAL_STATE_TAG:&[u8] = GLOBAL_STATE_SEED.as_bytes();
#[constant]
pub const REWARD_VAULT_SEED:&str = "REWARD_VAULT_SEED";
pub const REWARD_VAULT_TAG:&[u8] = REWARD_VAULT_SEED.as_bytes();
#[constant]
pub const OFFER_SEED:&str = "OFFER_SEED";
pub const OFFER_TAG:&[u8] = OFFER_SEED.as_bytes();
#[constant]
pub const LENDER_REWARD_SEED:&str = "LENDER_REWARD_SEED";
pub const LENDER_REWARD_TAG:&[u8] = LENDER_REWARD_SEED.as_bytes();
#[constant]
pub const SUB_OFFER_SEED:&str = "SUB_OFFER_SEED";
pub const SUB_OFFER_TAG:&[u8] = SUB_OFFER_SEED.as_bytes();
#[constant]
pub const NFT_VAULT_SEED:&str = "NFT_VAULT_SEED";
pub const NFT_VAULT_TAG:&[u8] = NFT_VAULT_SEED.as_bytes();
#[constant]
pub const OFFER_VAULT_SEED:&str = "OFFER_VAULT_SEED";
pub const OFFER_VAULT_TAG:&[u8] = OFFER_VAULT_SEED.as_bytes();
#[constant]
pub const TREASURY_VAULT_SEED:&str = "TREASURY_VAULT_SEED";
pub const TREASURY_VAULT_TAG:&[u8] = TREASURY_VAULT_SEED.as_bytes();

pub const WSOL_MINT:&str = "So11111111111111111111111111111111111111112";
pub const USDC_MINT:&str = if DEVNET_MODE {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"} else {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"};
pub const UNLOC_MINT:&str = if DEVNET_MODE {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"} else {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"};
#[constant]
pub const SUB_OFFER_COUNT_PER_LEVEL: u64 = 5;
#[constant]
pub const DEFULT_SUB_OFFER_COUNT: u64 = 3;
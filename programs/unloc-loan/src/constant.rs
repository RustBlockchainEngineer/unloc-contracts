use anchor_lang::prelude::*;

const CLUSTER: u8 = 0; // 0 - localnet, 1 - devnet, 2 - mainnet

#[constant]
pub const GLOBAL_STATE_SEED: &str = "GLOBAL_STATE_SEED";
pub const GLOBAL_STATE_TAG: &[u8] = GLOBAL_STATE_SEED.as_bytes();
#[constant]
pub const REWARD_VAULT_SEED: &str = "REWARD_VAULT_SEED";
pub const REWARD_VAULT_TAG: &[u8] = REWARD_VAULT_SEED.as_bytes();
#[constant]
pub const OFFER_SEED: &str = "OFFER_SEED";
pub const OFFER_TAG: &[u8] = OFFER_SEED.as_bytes();
#[constant]
pub const SUB_OFFER_SEED: &str = "SUB_OFFER_SEED";
pub const SUB_OFFER_TAG: &[u8] = SUB_OFFER_SEED.as_bytes();
#[constant]
pub const NFT_VAULT_SEED: &str = "NFT_VAULT_SEED";
pub const NFT_VAULT_TAG: &[u8] = NFT_VAULT_SEED.as_bytes();
#[constant]
pub const OFFER_VAULT_SEED: &str = "OFFER_VAULT_SEED";
pub const OFFER_VAULT_TAG: &[u8] = OFFER_VAULT_SEED.as_bytes();
#[constant]
pub const TREASURY_VAULT_SEED: &str = "TREASURY_VAULT_SEED";
pub const TREASURY_VAULT_TAG: &[u8] = TREASURY_VAULT_SEED.as_bytes();

pub const WSOL_MINT: &str = "So11111111111111111111111111111111111111112";
pub const USDC_MINT: &str = if CLUSTER == 0 {
    "GH1gUyAw7ems5MD46WGC9JPMHncLVBkHagpXgtYVUyPr"
} else if CLUSTER == 1 {
    "GH1gUyAw7ems5MD46WGC9JPMHncLVBkHagpXgtYVUyPr"
} else {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
pub const UNLOC_MINT: &str = if CLUSTER == 0 {
    "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
} else if CLUSTER == 1 {
    "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
} else {
    "ExW7Yek3vsRJcapsdRKcxF9XRRS8zigLZ8nqqdqnWgQi"
};
#[constant]
pub const SUB_OFFER_COUNT_PER_LEVEL: u64 = 5;
#[constant]
pub const DEFULT_SUB_OFFER_COUNT: u64 = 3;

pub const META_PREFIX: &[u8] = b"metadata";
pub const EDITION_PREFIX: &[u8] = b"edition";

pub const PRICE_DECIMALS_AMP: u64 = 100_000_000;
pub const SHARE_PRECISION: u128 = 1000_000_000_000;
pub const DIFF_SOL_USDC_DECIMALS: u128 = 1000;

pub const CHAINLINK_SOL_FEED: &str = if CLUSTER == 0 {
    "CcPVS9bqyXbD9cLnTbhhHazLsrua8QMFUHTutPtjyDzq"
} else if CLUSTER == 1 {
    "HgTtcbcmp5BeThax5AU8vg4VwK79qAvAKKFMs8txMLW6"
} else {
    "CcPVS9bqyXbD9cLnTbhhHazLsrua8QMFUHTutPtjyDzq"
};
pub const CHAINLINK_USDC_FEED: &str = if CLUSTER == 0 {
    "7CLo1BY41BHAVnEs57kzYMnWXyBJrVEBPpZyQyPo2p1G"
} else if CLUSTER == 1 {
    "4NmRgDfAZrfBHQBuzstMP5Bu1pgBzVn8u1djSvNrNkrN"
} else {
    "7CLo1BY41BHAVnEs57kzYMnWXyBJrVEBPpZyQyPo2p1G"
};
pub const INITIAL_OWNER: &str = "HV2t9B2oxdtkwbZrWj1vjZ2q3g4SH5rasGw8WohBFbvH";

pub const UNIX_DAY: i64 = 86400;

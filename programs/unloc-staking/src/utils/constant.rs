pub const DEVNET_MODE: bool = true;
pub const ACC_PRECISION: u128 = 100_000_000_000;
pub const MAX_LEVEL: usize = 10;
pub const MAX_PROFILE_LEVEL: usize = 5;
pub const FULL_100: u64 = 100_000_000_000;

pub const UNLOC_MINT: &str = if DEVNET_MODE {
    "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
} else {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
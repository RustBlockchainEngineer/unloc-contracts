pub const GLOBAL_STATE_TAG:&[u8] = b"global-state-seed";
pub const OFFER_TAG:&[u8] = b"offer-seed";
pub const SUB_OFFER_TAG:&[u8] = b"sub-offer-seed";
pub const NFT_VAULT_TAG:&[u8] = b"nft-vault-seed";
pub const OFFER_VAULT_TAG:&[u8] = b"offer-vault-seed";
pub const TREASURY_VAULT_TAG:&[u8] = b"treasury-vault-seed";

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
pub const INITIAL_SUPER_OWNER:&str = if DEVNET_MODE {"4GJ3z4skEHJADz3MVeNYBg4YV8H27rBQey2YYdiPC8PA"} else {"AwtDEd9GThBNWNahvLZUok1BiRULNQ86VruXkYAckCtV"};
pub const WSOL_MINT:&str = "So11111111111111111111111111111111111111112";
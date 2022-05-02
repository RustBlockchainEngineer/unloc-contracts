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
pub const GLOBAL_STATE_TAG:&[u8] = b"GLOBAL_STATE_TAG";
#[constant]
pub const VOTING_TAG:&[u8] = b"VOTING_TAG";
#[constant]
pub const VOTING_ITEM_TAG:&[u8] = b"VOTING_ITEM_TAG";
#[constant]
pub const VOTING_USER_TAG:&[u8] = b"VOTING_USER_TAG";


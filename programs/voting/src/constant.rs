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

pub const GLOBAL_STATE_TAG:&[u8] = b"GLOBAL_STATE_TAG";

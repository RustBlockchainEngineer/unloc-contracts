use anchor_lang::prelude::*;
//use anchor_spl::token::{self,  MintTo, Transfer, ID};

use crate::{
    //error::*,
    //constant::*,
    contexts::*,
    states::*,
};

pub fn process_cancel_sub_offer(ctx: Context<CancelSubOffer>, ) -> Result<()> { 
    ctx.accounts.sub_offer.state = SubOfferState::get_state(SubOfferState::Canceled);
    
    Ok(())
}

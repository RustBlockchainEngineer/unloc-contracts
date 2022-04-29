use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount,Mint, Transfer};

use crate::{
    error::*,
    constant::*,
    states::*,
    utils::*,
};
use mpl_token_metadata::{state::Metadata};

pub fn process_del_voting_item(ctx: Context<DelVotingItem>) -> Result<()> { 
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DelVotingItem<'info> {
    #[account(mut)]
    pub super_owner:  Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
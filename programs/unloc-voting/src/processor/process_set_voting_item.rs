use anchor_lang::prelude::*;
use anchor_spl::token::{Token};

use crate::{
    // error::*,
    constant::*,
    states::*,
    utils::*,
};

pub fn process_set_voting_item(ctx: Context<SetVotingItem>, key: Pubkey) -> Result<()> { 
    if is_zero_account(&ctx.accounts.voting_item.to_account_info()) {
        ctx.accounts.voting.total_items = ctx.accounts.voting.total_items.safe_add(1)?;
        ctx.accounts.voting_item.key = key;
        ctx.accounts.voting_item.voting = ctx.accounts.voting.key();
        ctx.accounts.voting_item.voting_score = 0;
        ctx.accounts.voting_item.bump = *ctx.bumps.get("voting_item").unwrap();
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(key: Pubkey)]
pub struct SetVotingItem<'info> {
    #[account(mut)]
    pub super_owner:  Signer<'info>,
    #[account(mut)]
    pub payer:  Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
        has_one = super_owner
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [VOTING_TAG, &voting.voting_number.to_be_bytes()],
        bump = voting.bump,
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        init,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), key.as_ref()],
        bump,
        payer = payer,
        space = std::mem::size_of::<VotingItem>() + 8,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
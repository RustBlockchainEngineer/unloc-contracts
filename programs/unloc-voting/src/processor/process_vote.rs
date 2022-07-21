use anchor_lang::prelude::*;
use anchor_spl::token::{Token};

use crate::{
    // error::*,
    constant::*,
    states::*,
    // utils::*,
};
use unloc_staking::FarmPoolUserAccount;
pub fn process_vote(ctx: Context<Vote>) -> Result<()> { 
    ctx.accounts.voting_user.bump = *ctx.bumps.get("voting_user").unwrap();
    ctx.accounts.voting_user.owner = ctx.accounts.user.key();
    ctx.accounts.voting_user.voting = ctx.accounts.voting.key();
    ctx.accounts.voting_user.voting_item = ctx.accounts.voting_item.key();
    ctx.accounts.voting_user.voting_score = ctx.accounts.staking_user.unloc_score;

    ctx.accounts.voting.total_score += ctx.accounts.voting_user.voting_score;
    
    ctx.accounts.voting_item.voting_score += ctx.accounts.voting_user.voting_score;

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct Vote<'info> {
    #[account(mut)]
    pub user:  Signer<'info>,
    
    #[account(mut)]
    pub payer:  Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump = global_state.bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [VOTING_TAG, &voting.voting_number.to_be_bytes()],
        bump = voting.bump,
    )]
    pub voting:Box<Account<'info, Voting>>,

    #[account(
        mut,
        seeds = [VOTING_ITEM_TAG, voting.key().as_ref(), voting_item.key.as_ref()],
        bump = voting_item.bump,
    )]
    pub voting_item:Box<Account<'info, VotingItem>>,

    // this voting_user account will be remained forever. we don't delete these accounts for permanent history
    #[account(
        init,
        seeds = [VOTING_USER_TAG, voting.key().as_ref(), user.key().as_ref()],
        bump,
        payer = payer,
        space = std::mem::size_of::<VotingUser>() + 8,
    )]
    pub voting_user:Box<Account<'info, VotingUser>>,

    #[account(
        mut,
        seeds = [staking_user.pool.as_ref(), user.key().as_ref()], 
        seeds::program = unloc_staking::id(),
        bump = staking_user.bump
    )]
    pub staking_user:Box<Account<'info, FarmPoolUserAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
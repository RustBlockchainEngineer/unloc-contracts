use crate::{constant::*, states::*, error::*};
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use crate::program::UnlocVoting;
pub fn process_create_global_state(
    ctx: Context<CreateGlobalState>,
) -> Result<()> {
    ctx.accounts.global_state.super_owner = ctx.accounts.super_owner.key();
    ctx.accounts.global_state.voting_count = 0;
    ctx.accounts.global_state.bump = *ctx.bumps.get("global_state").unwrap();

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateGlobalState<'info> {
    #[account(mut)]
    pub super_owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_TAG],
        bump,
        payer = payer,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    /// The unloc voting program.
    ///
    /// Provided here to check the upgrade authority.
    // #[account(constraint = voting_program.programdata_address()? == Some(program_data.key()) @ VotingError::InvalidProgramData)]
    // pub voting_program: Program<'info, UnlocVoting>,
    /// The program data account for the unloc voting program.
    ///
    /// Provided to check the upgrade authority.
    // #[account(constraint = program_data.upgrade_authority_address == Some(super_owner.key()) @ VotingError::InvalidProgramUpgradeAuthority)]
    // pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;
pub fn handle(ctx: Context<DepositRewards>, amount: u64) -> Result<()> { 
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    require(ctx.accounts.user_reward_vault.mint == unloc_mint)?;
    require(ctx.accounts.user_reward_vault.owner == ctx.accounts.authority.key())?;
    require(amount > 0)?;

    
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_reward_vault.to_account_info(),
        to: ctx.accounts.reward_vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    ctx.accounts.global_state.funded_amount += amount;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct DepositRewards<'info> {
    #[account(mut)]
    pub authority:  Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user_reward_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

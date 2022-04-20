use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{
    constant::*,
    states::*,
    utils::*,
};
use std::str::FromStr;
use std::cmp;

pub fn process_claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { 
    let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
    let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
    // let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
    require(ctx.accounts.user_reward_vault.mint == unloc_mint)?;
    require(ctx.accounts.user_reward_vault.owner == ctx.accounts.authority.key())?;

    let current_time = ctx.accounts.clock.unix_timestamp as u64;
    let start_time = ctx.accounts.lender_reward.start_time;
    let end_time = ctx.accounts.lender_reward.end_time;
    let last_claimed_time = ctx.accounts.lender_reward.last_claimed_time;
    let max_duration = ctx.accounts.lender_reward.max_duration;
    let loan_amount = ctx.accounts.lender_reward.loan_amount;
    let loan_mint = ctx.accounts.lender_reward.loan_mint;
    let loan_mint_decimals = ctx.accounts.lender_reward.loan_mint_decimals;
    let token_per_second = if wsol_mint ==  loan_mint {ctx.accounts.global_state.reward_per_sol} else {ctx.accounts.global_state.reward_per_usdc};
    let reward_end_time = cmp::min(start_time + max_duration, cmp::min(current_time, end_time));
    let reward_duration = reward_end_time - last_claimed_time;
    let decimals = 10u64.pow(loan_mint_decimals as u32);
    let reward_amount = calc_fee(reward_duration * token_per_second, loan_amount, decimals)?;
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.reward_vault.to_account_info(),
        to: ctx.accounts.user_reward_vault.to_account_info(),
        authority: ctx.accounts.global_state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let signer_seeds = &[
        GLOBAL_STATE_TAG, 
        &[bump(&[
            GLOBAL_STATE_TAG, 
        ], ctx.program_id)],
    ];
    let signer = &[&signer_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, reward_amount)?;

    ctx.accounts.lender_reward.claimed_amount += reward_amount;
    ctx.accounts.lender_reward.last_claimed_time = reward_end_time;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub authority:  Signer<'info>,
    #[account(
        seeds = [GLOBAL_STATE_TAG],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        seeds = [LENDER_REWARD_TAG, authority.key().as_ref(), lender_reward.sub_offer.as_ref()],
        bump,
        )]
    pub lender_reward:Box<Account<'info, LenderReward>>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_TAG],
        bump,
    )]
    pub reward_vault:Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub user_reward_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

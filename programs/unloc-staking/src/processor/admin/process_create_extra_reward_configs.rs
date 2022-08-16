use anchor_lang::prelude::*;

use crate::{states::*, utils::*};

pub fn handle(
    ctx: Context<CreateExtraRewardsConfigs>,
    configs: Vec<DurationExtraRewardConfig>,
) -> Result<()> {
    let extra_account = &mut ctx.accounts.extra_reward_account;
    extra_account.authority = ctx.accounts.authority.key();
    extra_account.bump = *ctx.bumps.get("extra_reward_account").unwrap();
    extra_account.configs = configs;
    extra_account.validate()?;
    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct CreateExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"state".as_ref()],
        bump = state.bump,
        has_one = authority
    )]
    pub state: Account<'info, StateAccount>,
    #[account(init,
        seeds = [b"extra".as_ref()], bump, payer = authority, space = 8 + 37 + MAX_LEVEL * 16)]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
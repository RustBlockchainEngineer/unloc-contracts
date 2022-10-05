use anchor_lang::prelude::*;

use crate::{states::*, error::*};

pub fn handle(
    ctx: Context<SetExtraRewardsConfigs>,
    configs: Vec<DurationExtraRewardConfig>,
) -> Result<()> {
    let extra_account = &mut ctx.accounts.extra_reward_account;
    extra_account.configs = configs;
    extra_account.validate()?;
    Ok(())
}

#[derive(Accounts)]
pub struct SetExtraRewardsConfigs<'info> {
    #[account(mut,
        seeds = [b"extra".as_ref()],
        bump = extra_reward_account.bump,
        has_one = authority @ StakingError::InvalidAuthority
    )]
    pub extra_reward_account: Box<Account<'info, ExtraRewardsAccount>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
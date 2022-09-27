use anchor_lang::prelude::*;
use crate::StateAccount;

#[account]
#[derive(Default)]
pub struct UserStateAccount {
    pub total_unloc_score: u128,
    pub stake_acct_seeds: Vec<u8>, // [u8; 20],
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub bump: u8,
    pub unloc_scores:  [u128; 21],
    pub profile_level: u64,
}

impl UserStateAccount {
    pub fn calc_overall_unloc_score<'info>(&mut self) -> Result<()> {
        let mut total: u128 = 0;
        for score in 0..21 {
            total += self.unloc_scores[score];
        }
        self.total_unloc_score = total;
        Ok(())
    }

    pub fn calc_user_profile_level<'info>(&mut self, state_account: &StateAccount) -> Result<()> {
        /*
        * calc overall unloc score
        * use user's overall unloc score to determine what their profile level is
        * what are the ranges ?
        */
        msg!("Calculating overall unloc score across all staking positions...");
        self.calc_overall_unloc_score()?;
        msg!("Unloc score: {}", self.total_unloc_score);

        self.profile_level = state_account.get_profile_level(self.total_unloc_score);
        msg!("Profile level: {}", self.profile_level);

        Ok(())
    }
}
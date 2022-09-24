use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct UserStateAccount {
    pub total_unloc_score: u128,
    pub stake_acct_seeds: Vec<u8>, // [u8; 20],
    pub authority: Pubkey,
    pub bump: u8,
    // anchor IDL does not support BTreeMaps
    pub unloc_scores:  [u128; 21],
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
}
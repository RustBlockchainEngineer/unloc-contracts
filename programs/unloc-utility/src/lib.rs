use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Token, TokenAccount, Transfer, Burn, Mint},
};
use std::str::FromStr;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub const GLOBAL_STATE_SEED:&[u8] = b"GLOBAL_STATE_SEED";
pub const UNLOC_VAULT_SEED:&[u8] = b"UNLOC_VAULT_SEED";
pub const WSOL_VAULT_SEED:&[u8] = b"WSOL_VAULT_SEED";
pub const USDC_VAULT_SEED:&[u8] = b"USDC_VAULT_SEED";


const DEVNET_MODE:bool = {
    #[cfg(feature = "devnet")]
    {
        true
    }
    #[cfg(not(feature = "devnet"))]
    {
        false
    }
};
pub const WSOL_MINT:&str = "So11111111111111111111111111111111111111112";
pub const USDC_MINT:&str = if DEVNET_MODE {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"} else {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"};
pub const UNLOC_MINT:&str = if DEVNET_MODE {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"} else {"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"};

#[program]
pub mod unloc_utility {
    use super::*;
    pub fn set_global_state(ctx: Context<SetGlobalState>, 
        new_authority: Pubkey,
        serum_market_pid: Pubkey,
        serum_market_sol_unloc_id: Pubkey,
        serum_market_usdc_unloc_id: Pubkey,
    ) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
        let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();
        require(ctx.accounts.unloc_mint.key() == unloc_mint, "wrong unloc_mint")?;
        require(ctx.accounts.usdc_mint.key() == usdc_mint, "wrong usdc_mint")?;
        require(ctx.accounts.wsol_mint.key() == wsol_mint, "wrong wsol_mint")?;

        if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
            ctx.accounts.global_state.authority = ctx.accounts.authority.key();
        }
        require(ctx.accounts.global_state.authority == ctx.accounts.authority.key(), "wrong authority of global state")?;

        ctx.accounts.global_state.authority = new_authority;
        ctx.accounts.global_state.serum_market_pid = serum_market_pid;
        ctx.accounts.global_state.serum_market_sol_unloc_id = serum_market_sol_unloc_id;
        ctx.accounts.global_state.serum_market_usdc_unloc_id = serum_market_usdc_unloc_id;
        Ok(())
    }
    pub fn buyback(ctx: Context<BuyBack>, amount: u64) -> Result<()> {
        Ok(())
    }
    pub fn burn(ctx: Context<BurnUnloc>, amount: u64) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        require(ctx.accounts.unloc_mint.key() == unloc_mint, "wrong unloc_mint")?;
        require(ctx.accounts.unloc_vault.amount >= amount, "not enough amount")?;

        let cpi_accounts = Burn {
            mint: ctx.accounts.unloc_mint.to_account_info(),
            to: ctx.accounts.unloc_vault.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
    
        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
        token::burn(cpi_ctx, amount)?;
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction()]
pub struct SetGlobalState <'info>{
    #[account(mut)]
    pub authority:  Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_SEED],
        bump,
        payer = authority,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    pub unloc_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = unloc_mint,
        token::authority = global_state,
        seeds = [UNLOC_VAULT_SEED],
        bump,
        payer = authority,
    )]
    pub unloc_vault:Box<Account<'info, TokenAccount>>,
    pub usdc_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = usdc_mint,
        token::authority = global_state,
        seeds = [USDC_VAULT_SEED],
        bump,
        payer = authority,
    )]
    pub usdc_vault:Box<Account<'info, TokenAccount>>,

    pub wsol_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = wsol_mint,
        token::authority = global_state,
        seeds = [WSOL_VAULT_SEED],
        bump,
        payer = authority,
    )]
    pub wsol_vault:Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct BuyBack {

}

#[derive(Accounts)]
pub struct BurnUnloc <'info> {
    #[account(mut)]
    pub authority:  Signer<'info>,
    pub unloc_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        seeds = [USDC_VAULT_SEED],
        bump,
    )]
    pub unloc_vault:Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub authority: Pubkey,
    pub serum_market_pid: Pubkey,
    pub serum_market_sol_unloc_id: Pubkey,
    pub serum_market_usdc_unloc_id: Pubkey,
}



#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("AlreadyInUse")]
    AlreadyInUse,
    #[msg("InvalidProgramAddress")]
    InvalidProgramAddress,
    #[msg("InvalidState")]
    InvalidState,
    #[msg("InvalidOwner")]
    InvalidOwner,
    #[msg("NotAllowed")]
    NotAllowed,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("InvalidAccountInput")]
    InvalidAccountInput,
    #[msg("InvalidPubkey")]
    InvalidPubkey,
    #[msg("InvalidAmount")]
    InvalidAmount,
    #[msg("InvalidDenominator")]
    InvalidDenominator,
}
pub fn require(flag: bool, msg: &str) -> Result<()> {
    msg!("error in require function: {}", msg);
    if !flag {
        return Err(error!(ErrorCode::NotAllowed));
    }
    Ok(())
}

pub fn is_zero_account(account_info:&AccountInfo)->bool{
    let account_data: &[u8] = &account_info.data.borrow();
    let len = account_data.len();
    let mut is_zero = true;
    for i in 0..len-1 {
        if account_data[i] != 0 {
            is_zero = false;
        }
    }
    is_zero
}

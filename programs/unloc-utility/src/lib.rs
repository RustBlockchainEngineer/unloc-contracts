use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Token, TokenAccount, Burn, Mint},
};
use swap::{
    Side,
    cpi::{
        accounts::{Swap, MarketAccounts},
        swap
    },
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
        serum_swap_pid: Pubkey,
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
        ctx.accounts.global_state.serum_swap_pid = serum_swap_pid;
        ctx.accounts.global_state.serum_market_pid = serum_market_pid;
        ctx.accounts.global_state.serum_market_sol_unloc_id = serum_market_sol_unloc_id;
        ctx.accounts.global_state.serum_market_usdc_unloc_id = serum_market_usdc_unloc_id;
        Ok(())
    }
    pub fn buyback(ctx: Context<BuyBack>, amount: u64) -> Result<()> {
        let cpi_accounts = Swap {
            market: MarketAccounts{
                market: ctx.accounts.market_accounts.market.to_account_info(),
                open_orders: ctx.accounts.market_accounts.open_orders.to_account_info(),
                request_queue: ctx.accounts.market_accounts.request_queue.to_account_info(),
                event_queue: ctx.accounts.market_accounts.event_queue.to_account_info(),
                bids: ctx.accounts.market_accounts.bids.to_account_info(),
                asks: ctx.accounts.market_accounts.asks.to_account_info(),
                order_payer_token_account: ctx.accounts.market_accounts.order_payer_token_account.to_account_info(),
                coin_vault: ctx.accounts.market_accounts.coin_vault.to_account_info(),
                pc_vault: ctx.accounts.market_accounts.pc_vault.to_account_info(),
                vault_signer: ctx.accounts.market_accounts.vault_signer.to_account_info(),
                coin_wallet: ctx.accounts.market_accounts.coin_wallet.to_account_info()
            },
            authority: ctx.accounts.global_state.to_account_info(),
            pc_wallet: ctx.accounts.global_state.to_account_info(),
            dex_program: ctx.accounts.serum_market_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info()
        };
    
        let cpi_program = ctx.accounts.serum_swap_program.to_account_info();
        let signer_seeds = &[
            GLOBAL_STATE_SEED, 
            &[bump(&[
                GLOBAL_STATE_SEED, 
            ], ctx.program_id)],
        ];
        let signer = &[&signer_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
        swap(cpi_ctx, Side::Bid, amount, amount)?;
        Ok(())
    }
    pub fn burn(ctx: Context<BurnUnloc>, amount: u64) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        require(ctx.accounts.unloc_mint.key() == unloc_mint, "wrong unloc_mint")?;
        require(ctx.accounts.unloc_vault.amount >= amount, "not enough amount")?;

        let cpi_accounts = Burn {
            mint: ctx.accounts.unloc_mint.to_account_info(),
            from: ctx.accounts.unloc_vault.to_account_info(),
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
pub struct BuyBack <'info>{
    #[account(mut)]
    pub authority:  Signer<'info>,
    /// CHECK: unchecked account
    pub serum_swap_program: AccountInfo<'info>,
    /// CHECK: unchecked account
    pub serum_market_program: AccountInfo<'info>,
    /// CHECK: unchecked account
    pub serum_market: AccountInfo<'info>,
    pub market_accounts: CtxMarketAccounts<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts, Clone)]
pub struct CtxMarketAccounts<'info> {
    /// CHECK: unchecked account
    #[account(mut)]
    market: AccountInfo<'info>,
    /// CHECK: unchecked account
    #[account(mut)]
    open_orders: AccountInfo<'info>,
    /// CHECK: unchecked account
    #[account(mut)]
    request_queue: AccountInfo<'info>,
    /// CHECK: unchecked account
    #[account(mut)]
    event_queue: AccountInfo<'info>,
    /// CHECK: unchecked account
    #[account(mut)]
    bids: AccountInfo<'info>,
    /// CHECK: unchecked account
    #[account(mut)]
    asks: AccountInfo<'info>,
    // The `spl_token::Account` that funds will be taken from, i.e., transferred
    // from the user into the market's vault.
    //
    // For bids, this is the base currency. For asks, the quote.
    /// CHECK: unchecked account
    #[account(mut)]
    order_payer_token_account: AccountInfo<'info>,
    // Also known as the "base" currency. For a given A/B market,
    // this is the vault for the A mint.
    /// CHECK: unchecked account
    #[account(mut)]
    coin_vault: AccountInfo<'info>,
    // Also known as the "quote" currency. For a given A/B market,
    // this is the vault for the B mint.
    /// CHECK: unchecked account
    #[account(mut)]
    pc_vault: AccountInfo<'info>,
    // PDA owner of the DEX's token accounts for base + quote currencies.
    /// CHECK: unchecked account
    vault_signer: AccountInfo<'info>,
    // User wallets.
    /// CHECK: unchecked account
    #[account(mut)]
    coin_wallet: AccountInfo<'info>,
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
    pub serum_swap_pid: Pubkey,
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

pub fn bump(seeds:&[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}

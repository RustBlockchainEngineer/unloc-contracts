use amm_anchor::SwapBaseIn;
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{
        self, 
        Token, 
        TokenAccount, 
        Burn, 
        Mint, 
        accessor::amount,
    },
};
use std::str::FromStr;
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[constant]
pub const GLOBAL_STATE_SEED:&[u8] = b"GLOBAL_STATE_SEED";
#[constant]
pub const UNLOC_VAULT_SEED:&[u8] = b"UNLOC_VAULT_SEED";
#[constant]
pub const WSOL_VAULT_SEED:&[u8] = b"WSOL_VAULT_SEED";
#[constant]
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
pub mod unloc_burn {
    use super::*;
    pub fn set_global_state(ctx: Context<SetGlobalState>, 
        new_authority: Pubkey,
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

        ctx.accounts.global_state.amm_program = ctx.accounts.amm_program.key();
        ctx.accounts.global_state.amm = ctx.accounts.amm.key();
        ctx.accounts.global_state.amm_authority = ctx.accounts.amm_authority.key();
        ctx.accounts.global_state.amm_open_orders = ctx.accounts.amm_open_orders.key();
        ctx.accounts.global_state.amm_target_orders = ctx.accounts.amm_target_orders.key();
        ctx.accounts.global_state.pool_coin_token_account = ctx.accounts.pool_coin_token_account.key();
        ctx.accounts.global_state.pool_pc_token_account = ctx.accounts.pool_pc_token_account.key();
        ctx.accounts.global_state.serum_program = ctx.accounts.serum_program.key();
        ctx.accounts.global_state.serum_market = ctx.accounts.serum_market.key();
        ctx.accounts.global_state.serum_bids = ctx.accounts.serum_bids.key();
        ctx.accounts.global_state.serum_asks = ctx.accounts.serum_asks.key();
        ctx.accounts.global_state.serum_event_queue = ctx.accounts.serum_event_queue.key();
        ctx.accounts.global_state.serum_coin_vault_account = ctx.accounts.serum_coin_vault_account.key();
        ctx.accounts.global_state.serum_pc_vault_account = ctx.accounts.serum_pc_vault_account.key();
        ctx.accounts.global_state.serum_vault_signer = ctx.accounts.serum_vault_signer.key();

        Ok(())
    }
    pub fn buyback(ctx: Context<Buyback>) -> Result<()> {
        ctx.accounts.validate()?;
        
        let amount_in: u64 = amount(&ctx.accounts.user_source_token_account.clone())?;
        let minimum_amount_out: u64 = 0;

        let signer_seeds = &[
            GLOBAL_STATE_SEED, 
            &[bump(&[
                GLOBAL_STATE_SEED, 
            ], &crate::ID)],
        ];
        let signer = &[&signer_seeds[..]];
        let ctx_swap = ctx.accounts.to_ctx();
        amm_anchor::swap_base_in(ctx_swap.with_signer(signer), amount_in, minimum_amount_out)
    }
    pub fn burn(ctx: Context<BurnUnloc>) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        require(ctx.accounts.unloc_mint.key() == unloc_mint, "wrong unloc_mint")?;

        let cpi_accounts = Burn {
            mint: ctx.accounts.unloc_mint.to_account_info(),
            from: ctx.accounts.unloc_vault.to_account_info(),
            authority: ctx.accounts.global_state.to_account_info(),
        };
    
        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        let signer_seeds = &[
            GLOBAL_STATE_SEED, 
            &[bump(&[
                GLOBAL_STATE_SEED, 
            ], ctx.program_id)],
        ];
        let signer = &[&signer_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
        token::burn(cpi_ctx, ctx.accounts.unloc_vault.amount)?;
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

    /// CHECK: Safe
    pub amm_program: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm: AccountInfo<'info>,
    /// CHECK: Safe
    pub amm_authority: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm_open_orders: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm_target_orders: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub pool_coin_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub pool_pc_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    pub serum_program: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_bids: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_asks: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_event_queue: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_coin_vault_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_pc_vault_account: AccountInfo<'info>,
    /// CHECK: Safe
    pub serum_vault_signer: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts, Clone)]
pub struct Buyback<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,

    /// CHECK: Safe
    pub amm_program: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm: AccountInfo<'info>,
    /// CHECK: Safe
    pub amm_authority: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm_open_orders: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm_target_orders: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub pool_coin_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub pool_pc_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    pub serum_program: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_bids: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_asks: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_event_queue: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_coin_vault_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_pc_vault_account: AccountInfo<'info>,
    /// CHECK: Safe
    pub serum_vault_signer: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub user_source_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub user_destination_token_account: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(address = token::ID)]
    pub spl_token_program: AccountInfo<'info>,
}
impl<'a, 'b, 'c, 'info> Buyback<'info> {
    pub fn validate(&self) -> Result<()> {
        
        require(self.global_state.amm_program == self.amm_program.key(), "wrong amm_program")?;
        require(self.global_state.amm == self.amm.key(), "wrong amm")?;
        require(self.global_state.amm_authority == self.amm_authority.key(), "wrong amm_authority")?;
        require(self.global_state.amm_open_orders == self.amm_open_orders.key(), "wrong amm_open_orders")?;
        require(self.global_state.amm_target_orders == self.amm_target_orders.key(), "wrong amm_target_orders")?;
        require(self.global_state.pool_coin_token_account == self.pool_coin_token_account.key(), "wrong pool_coin_token_account")?;
        require(self.global_state.pool_pc_token_account == self.pool_pc_token_account.key(), "wrong pool_pc_token_account")?;
        require(self.global_state.serum_program == self.serum_program.key(), "wrong serum_program")?;
        require(self.global_state.serum_market == self.serum_market.key(), "wrong serum_market")?;
        require(self.global_state.serum_bids == self.serum_bids.key(), "wrong serum_bids")?;
        require(self.global_state.serum_asks == self.serum_asks.key(), "wrong serum_asks")?;
        require(self.global_state.serum_event_queue == self.serum_event_queue.key(), "wrong serum_event_queue")?;
        require(self.global_state.serum_coin_vault_account == self.serum_coin_vault_account.key(), "wrong serum_coin_vault_account")?;
        require(self.global_state.serum_pc_vault_account == self.serum_pc_vault_account.key(), "wrong serum_pc_vault_account")?;
        require(self.global_state.serum_vault_signer == self.serum_vault_signer.key(), "wrong serum_vault_signer")?;

        Ok(())
    }
    pub fn to_ctx(&self) -> CpiContext<'a, 'b, 'c, 'info, SwapBaseIn<'info>> {
        let cpi_accounts = SwapBaseIn {
            amm: self.amm.clone(),
            amm_authority: self.amm_authority.clone(),
            amm_open_orders: self.amm_open_orders.clone(),
            amm_target_orders: self.amm_target_orders.clone(),
            pool_coin_token_account: self.pool_coin_token_account.clone(),
            pool_pc_token_account: self.pool_pc_token_account.clone(),
            serum_program: self.serum_program.clone(),
            serum_market: self.serum_market.clone(),
            serum_bids: self.serum_bids.clone(),
            serum_asks: self.serum_asks.clone(),
            serum_event_queue: self.serum_event_queue.clone(),
            serum_coin_vault_account: self.serum_coin_vault_account.clone(),
            serum_pc_vault_account: self.serum_pc_vault_account.clone(),
            serum_vault_signer: self.serum_vault_signer.clone(),
            user_source_token_account: self.user_source_token_account.clone(),
            user_destination_token_account: self.user_destination_token_account.clone(),
            user_source_owner: self.global_state.to_account_info().clone(),
            spl_token_program: self.spl_token_program.clone(),
        };
        let cpi_program = self.amm_program.clone();
        
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
#[derive(Accounts)]
pub struct BurnUnloc <'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump,
    )]
    pub global_state:Box<Account<'info, GlobalState>>,
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

    pub amm_program: Pubkey,
    pub amm: Pubkey,
    pub amm_authority: Pubkey,
    pub amm_open_orders: Pubkey,
    pub amm_target_orders: Pubkey,
    pub pool_coin_token_account: Pubkey,
    pub pool_pc_token_account: Pubkey,
    pub serum_program: Pubkey,
    pub serum_market: Pubkey,
    pub serum_bids: Pubkey,
    pub serum_asks: Pubkey,
    pub serum_event_queue: Pubkey,
    pub serum_coin_vault_account: Pubkey,
    pub serum_pc_vault_account: Pubkey,
    pub serum_vault_signer: Pubkey,
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

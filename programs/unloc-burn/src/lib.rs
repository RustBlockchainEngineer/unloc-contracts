use amm_anchor::{Amm as RaydiumSwap, SwapBaseIn};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, accessor::amount, Burn, Mint, Token, TokenAccount};
use std::str::FromStr;
declare_id!("37TgoUgxSshhJmhNEAQMmAWF7XRhXEaY5HxcTZ6eYs6r");

#[constant]
pub const GLOBAL_STATE_SEED: &[u8] = b"GLOBAL_STATE_SEED";
#[constant]
pub const UNLOC_VAULT_SEED: &[u8] = b"UNLOC_VAULT_SEED";
#[constant]
pub const WSOL_VAULT_SEED: &[u8] = b"WSOL_VAULT_SEED";
#[constant]
pub const USDC_VAULT_SEED: &[u8] = b"USDC_VAULT_SEED";

const DEVNET_MODE: bool = true;
pub const WSOL_MINT: &str = "So11111111111111111111111111111111111111112";
pub const USDC_MINT: &str = if DEVNET_MODE {
    "GH1gUyAw7ems5MD46WGC9JPMHncLVBkHagpXgtYVUyPr"
} else {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
pub const UNLOC_MINT: &str = if DEVNET_MODE {
    "Bt8KVz26uLrXrMzRKaJgX9rYd2VcfBh8J67D4s3kRmut"
} else {
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};
pub const INITIAL_OWNER: &str = "atPFsAVbFFpgtdDoXMyVnp3696PZVfJ3MGQp6CiuZfW";

#[program]
pub mod unloc_burn {
    use super::*;
    pub fn set_global_state(
        ctx: Context<SetGlobalState>,
        new_authority: Pubkey,
        new_burner: Pubkey,
    ) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        let usdc_mint = Pubkey::from_str(USDC_MINT).unwrap();
        let wsol_mint = Pubkey::from_str(WSOL_MINT).unwrap();

        require(
            ctx.accounts.unloc_mint.key() == unloc_mint,
            "wrong unloc_mint",
        )?;
        require(ctx.accounts.usdc_mint.key() == usdc_mint, "wrong usdc_mint")?;
        require(ctx.accounts.wsol_mint.key() == wsol_mint, "wrong wsol_mint")?;

        if is_zero_account(&ctx.accounts.global_state.to_account_info()) {
            let initial_owner = Pubkey::from_str(INITIAL_OWNER).unwrap();
            require_keys_eq!(initial_owner, ctx.accounts.authority.key());
            ctx.accounts.global_state.authority = ctx.accounts.authority.key();
            ctx.accounts.global_state.bump = *ctx.bumps.get("global_state").unwrap();
            ctx.accounts.global_state.unloc_vault_bump = *ctx.bumps.get("unloc_vault").unwrap();
            ctx.accounts.global_state.usdc_vault_bump = *ctx.bumps.get("usdc_vault").unwrap();
            ctx.accounts.global_state.wsol_vault_bump = *ctx.bumps.get("wsol_vault").unwrap();
        }
        require(
            ctx.accounts.global_state.authority == ctx.accounts.authority.key(),
            "wrong authority of global state",
        )?;

        ctx.accounts.global_state.authority = new_authority;

        ctx.accounts.global_state.amm = ctx.accounts.amm.key();
        ctx.accounts.global_state.serum_program = ctx.accounts.serum_program.key();
        ctx.accounts.global_state.serum_market = ctx.accounts.serum_market.key();
        ctx.accounts.global_state.unloc_vault = ctx.accounts.unloc_vault.key();
        ctx.accounts.global_state.usdc_vault = ctx.accounts.usdc_vault.key();
        ctx.accounts.global_state.wsol_vault = ctx.accounts.wsol_vault.key();
        ctx.accounts.global_state.burner = new_burner;

        Ok(())
    }
    pub fn buyback(ctx: Context<Buyback>) -> Result<()> {
        let amount_in: u64 = amount(&ctx.accounts.user_source_token_account.clone())?;
        let minimum_amount_out: u64 = 0;

        let signer_seeds = &[GLOBAL_STATE_SEED, &[bump(&[GLOBAL_STATE_SEED], &crate::ID)]];
        let signer = &[&signer_seeds[..]];
        let ctx_swap = ctx.accounts.to_ctx();
        amm_anchor::swap_base_in(ctx_swap.with_signer(signer), amount_in, minimum_amount_out)
    }
    pub fn burn(ctx: Context<BurnUnloc>) -> Result<()> {
        let unloc_mint = Pubkey::from_str(UNLOC_MINT).unwrap();
        require(
            ctx.accounts.unloc_mint.key() == unloc_mint,
            "wrong unloc_mint",
        )?;

        let cpi_accounts = Burn {
            mint: ctx.accounts.unloc_mint.to_account_info(),
            from: ctx.accounts.unloc_vault.to_account_info(),
            authority: ctx.accounts.global_state.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let signer_seeds = &[
            GLOBAL_STATE_SEED,
            &[bump(&[GLOBAL_STATE_SEED], ctx.program_id)],
        ];
        let signer = &[&signer_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::burn(cpi_ctx, ctx.accounts.unloc_vault.amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct SetGlobalState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_STATE_SEED],
        bump,
        payer = payer,
        space = std::mem::size_of::<GlobalState>() + 8
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    pub unloc_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = unloc_mint,
        token::authority = global_state,
        seeds = [UNLOC_VAULT_SEED],
        bump,
        payer = payer,
    )]
    pub unloc_vault: Box<Account<'info, TokenAccount>>,
    pub usdc_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = usdc_mint,
        token::authority = global_state,
        seeds = [USDC_VAULT_SEED],
        bump,
        payer = payer,
    )]
    pub usdc_vault: Box<Account<'info, TokenAccount>>,

    pub wsol_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        token::mint = wsol_mint,
        token::authority = global_state,
        seeds = [WSOL_VAULT_SEED],
        bump,
        payer = payer,
    )]
    pub wsol_vault: Box<Account<'info, TokenAccount>>,

    pub amm_program: Program<'info, RaydiumSwap>,
    /// CHECK: Safe
    #[account(mut)]
    pub amm: AccountInfo<'info>,
    /// CHECK: Safe
    pub serum_program: AccountInfo<'info>,
    /// CHECK: Safe
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    /// CHECK: Safe
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts, Clone)]
pub struct Buyback<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = burner,
        has_one = amm,
        has_one = serum_program,
        has_one = serum_market,
        constraint = global_state.usdc_vault == user_source_token_account.key() || global_state.wsol_vault == user_source_token_account.key(),
        constraint = global_state.unloc_vault == user_destination_token_account.key()
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(mut)]
    pub burner: Signer<'info>,

    pub amm_program: Program<'info, RaydiumSwap>,
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
        let cpi_program = self.amm_program.to_account_info();

        CpiContext::new(cpi_program, cpi_accounts)
    }
}
#[derive(Accounts)]
pub struct BurnUnloc<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = burner
    )]
    pub global_state: Box<Account<'info, GlobalState>>,
    #[account(mut)]
    pub burner: Signer<'info>,
    #[account(mut)]
    pub unloc_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        seeds = [UNLOC_VAULT_SEED],
        bump = global_state.unloc_vault_bump,
    )]
    pub unloc_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}
#[account]
#[derive(Default)]
pub struct GlobalState {
    pub bump: u8,
    pub unloc_vault_bump: u8,
    pub usdc_vault_bump: u8,
    pub wsol_vault_bump: u8,
    pub authority: Pubkey,
    pub burner: Pubkey,

    pub amm: Pubkey,
    pub serum_program: Pubkey,
    pub serum_market: Pubkey,
    pub usdc_vault: Pubkey,
    pub unloc_vault: Pubkey,
    pub wsol_vault: Pubkey,
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
    if !flag {
        msg!("error in require function: {}", msg);
        return Err(error!(ErrorCode::NotAllowed));
    }
    Ok(())
}

pub fn is_zero_account(account_info: &AccountInfo) -> bool {
    let account_data: &[u8] = &account_info.data.borrow();
    let len = account_data.len();
    let mut is_zero = true;
    for i in 0..len - 1 {
        if account_data[i] != 0 {
            is_zero = false;
        }
    }
    is_zero
}

pub fn bump(seeds: &[&[u8]], program_id: &Pubkey) -> u8 {
    let (_found_key, bump) = Pubkey::find_program_address(seeds, program_id);
    bump
}

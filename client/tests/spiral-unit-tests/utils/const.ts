import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from './../../test-users/super_owner.json'
import TREASURY from './../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from './../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from './../../keypairs/usdc-token.json'
import { UnlocLoan } from './../../../src/types/unloc_loan';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT } from './../../../src';
import { defaults } from './../../../src/global-config'
import { safeAirdrop, pda, createTokenMints, initGlobalStateAccount, SubOfferState, OfferState, createAndMintNft } from './../utils/loan-utils'
import PROPOSER1_WALLET from './../../test-users/borrower1.json'
import { Keypair } from '@solana/web3.js'

// fetch test keypairs
export const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
export const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
export const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
export const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
export const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))

export const GLOBAL_STATE_TAG = Buffer.from('GLOBAL_STATE_SEED')
export const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')
export const OFFER_SEED = Buffer.from("OFFER_SEED")
export const SUB_OFFER_SEED = Buffer.from("SUB_OFFER_SEED")
export const TREASURY_VAULT_TAG = Buffer.from('TREASURY_VAULT_SEED')
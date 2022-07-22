
import * as anchor from '@project-serum/anchor';
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { IDL as idl, UnlocLoan } from '../../../src/types/unloc_loan'
import SUPER_OWNER_WALLET from '../../test-users/super_owner.json'
import UNLOC_TOKEN_KEYPAIR from '../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../keypairs/usdc-token.json'
import TREASURY from '../../test-users/treasury.json'
import { defaults } from '../../../src/global-config'

const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
const superOwner = superOwnerKeypair.publicKey
const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
const treasury = treasuryKeypair.publicKey;
const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')


export let program: anchor.Program<UnlocLoan> = null as unknown as anchor.Program<UnlocLoan>
export let programProvider: anchor.AnchorProvider = null as unknown as anchor.AnchorProvider
export let programId: anchor.web3.PublicKey = null as unknown as anchor.web3.PublicKey

// Configure the client to use the local cluster.
const envProvider = anchor.AnchorProvider.env();
const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
anchor.setProvider(provider);

export async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
    while (await connection.getBalance(key) < amount * 1000000000){
      try{
        await connection.confirmTransaction(
          await connection.requestAirdrop(key, 1000000000),
          "confirmed"
        );
      }catch{}
    };
  }
  
  export async function pda(seeds: (Buffer | Uint8Array)[], programId: anchor.web3.PublicKey) {
    const [pdaKey] =
      await anchor.web3.PublicKey.findProgramAddress(
        seeds,
        programId,
      );
    return pdaKey
  }

  export async function createTokenMints(superOwner: anchor.web3.Keypair, unlocKeypair: anchor.web3.Keypair, usdcKeypair: anchor.web3.Keypair) {
    const usdcMint = await provider.connection.getAccountInfo(usdcKeypair.publicKey)
    const unlocMint = await provider.connection.getAccountInfo(unlocKeypair.publicKey)
    let accountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(MintLayout.span)
    
    // if Unloc and USDC mint have not been created yet, initialize the mints
    if (unlocMint == null || usdcMint == null){
      const createMintTx = new Transaction()
      createMintTx.add(
        SystemProgram.createAccount({
          fromPubkey: superOwner.publicKey,
          newAccountPubkey: unlocKeypair.publicKey,
          lamports: accountRentExempt,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      )
      createMintTx.add(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          unlocKeypair.publicKey,
          6,
          superOwner.publicKey,
          superOwner.publicKey
        )
      )
      createMintTx.add(
        SystemProgram.createAccount({
            fromPubkey: superOwner.publicKey,
            newAccountPubkey: usdcKeypair.publicKey,
            lamports: accountRentExempt,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
      )
      createMintTx.add(
          Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              usdcKeypair.publicKey,
              6,
              superOwner.publicKey,
              superOwner.publicKey
          )
      )
      await provider.sendAndConfirm(createMintTx, [superOwner, unlocKeypair, usdcKeypair], {})
    }
  }

  export async function initGlobalStateAccount(globalStateKey: anchor.web3.PublicKey, programId: anchor.web3.PublicKey, accruedInterestNumerator: number, denominator: number,
    minRepaidNumerator: number, aprNumerator: number, expireLoanDuration: number, rewardRate: number, lenderRewardsPercentage: number){
    
      let globalStateAcct = await provider.connection.getAccountInfo(globalStateKey)
      console.log("Global state key: ", globalStateKey)
      console.log("Global state Accoutn Info: ", globalStateAcct)

      if(globalStateAcct == null ){
        const rewardVault = await pda([REWARD_VAULT_TAG], programId)

        const signers = [superOwnerKeypair]
        try {
          const tx = await program.methods.setGlobalState(accruedInterestNumerator, denominator, minRepaidNumerator, aprNumerator, expireLoanDuration, rewardRate, lenderRewardsPercentage)
          .accounts({
            superOwner: superOwner,
            payer: superOwner,
            globalState: globalStateKey,
            rewardMint: unlocTokenKeypair.publicKey,
            rewardVault: rewardVault,
            newSuperOwner: superOwner,
            treasuryWallet: treasury,
            ...defaults
          })
          .signers(signers)
          .rpc()

          console.log("Set loan global state tx: ", tx)
        } catch (e) {
          console.log("Error: ", e)
        }
  }
}
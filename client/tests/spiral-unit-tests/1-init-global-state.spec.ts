import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../test-users/super_owner.json'
import PROPOSER1_WALLET from '../test-users/borrower1.json'
import LOANER1_WALLET from '../test-users/lender1.json'
import TREASURY from '../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../keypairs/usdc-token.json'
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction, TransactionInstruction, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { UnlocLoan } from '../../src/types/unloc_loan';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT, VOTING_PID, getVotingKeyFromNum, systemProgram } from '../../src';
import { setLoanGlobalState } from '../../src';
import { assert } from 'console';
import { defaults } from '../../src/global-config'

describe('global-init', async () => {

  // fetch test keypairs
  const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
  const superOwner = superOwnerKeypair.publicKey;
  const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
  const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
  const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
  const borrower = borrowerKeypair.publicKey;
  const lender1Keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LOANER1_WALLET))
  const lender1 = lender1Keypair.publicKey;
  const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
  const treasury = treasuryKeypair.publicKey;

  // define constants
  const rent = anchor.web3.SYSVAR_RENT_PUBKEY
  const clock = anchor.web3.SYSVAR_CLOCK_PUBKEY

  //const GLOBAL_STATE_SEED = Buffer.from("GLOBAL_STATE_SEED");
  const GLOBAL_STATE_TAG = Buffer.from('GLOBAL_STATE_SEED')
  const OFFER_SEED = Buffer.from("OFFER_SEED");
  const SUB_OFFER_SEED = Buffer.from("SUB_OFFER_SEED");
  const REWARD_VAULT_SEED = Buffer.from("REWARD_VAULT_SEED");
  const OFFER_VAULT_SEED = Buffer.from("OFFER_VAULT_SEED");
  const TREASURY_VAULT_SEED = Buffer.from("TREASURY_VAULT_SEED");
  const USER_REWARD_TAG = Buffer.from('LENDER_REWARD_SEED')
  const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')

  

  let nftMint: Token = null as any;
  let nftMetadataKey: anchor.web3.PublicKey = null as any;
  let nftEditionKey: anchor.web3.PublicKey = null as any;
  let offerMint: Token = null as any;
  const offerDecimal = 1000_000_000
  let borrowerNftVault: anchor.web3.PublicKey = null as any;
  let lenderNftVault: anchor.web3.PublicKey = null as any;
  let borrowerOfferVault: anchor.web3.PublicKey = null as any;
  let lenderOfferVault: anchor.web3.PublicKey = null as any;
  let rewardVaultOfSuperOwner: anchor.web3.PublicKey = null as any;

  const denominator = new anchor.BN(10000);
  const lenderRewardsPercentage = new anchor.BN(6000);
  const rewardMint = UNLOC_MINT
  
  
  // Configure the client to use the local cluster.
  const envProvider = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
  anchor.setProvider(provider);

  const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
  const programId = program.programId

  const globalState = await pda([GLOBAL_STATE_TAG], programId)
  const rewardVault = await pda([REWARD_VAULT_TAG], programId)
  

  it('Is initialized!', async () => {
    
      await safeAirdrop(provider.connection, superOwner, 10)
      let accountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(
          MintLayout.span
          );
      const instructions: TransactionInstruction[] = []
      instructions.push(
        SystemProgram.createAccount({
          fromPubkey: superOwner,
          newAccountPubkey: unlocTokenKeypair.publicKey,
          lamports: accountRentExempt,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      );
    
      instructions.push(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          unlocTokenKeypair.publicKey,
          6,
          superOwner,
          superOwner
        )
      );

      // create USDC token
      instructions.push(
          SystemProgram.createAccount({
              fromPubkey: superOwner,
              newAccountPubkey: usdcTokenKeypair.publicKey,
              lamports: accountRentExempt,
              space: MintLayout.span,
              programId: TOKEN_PROGRAM_ID,
          })
      );
  
      instructions.push(
          Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              usdcTokenKeypair.publicKey,
              6,
              superOwner,
              superOwner
          )
      );
      const tx = new Transaction()
      tx.add(...instructions)
      await provider.sendAndConfirm(tx, [superOwnerKeypair, unlocTokenKeypair, usdcTokenKeypair], {})
  })

  it('init loan program', async () => {
    /* 
      Declare parameters for the process_set_global_state instruction.
      This instruction initalizes the state of the GlobalState account.
    */
    const accruedInterestNumerator = new anchor.BN(10000000);
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100); // 1%
    const minRepaidNumerator = new anchor.BN(denominator.toNumber() / 2); // 0.5
    const rewardRate = new anchor.BN(300);
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600);
    const unlocStakingPid = STAKING_PID
    const votingPid = VOTING_PID
    const tokenMetadataPid = TOKEN_META_PID

    const [unlocStakingPoolId] = await anchor.web3.PublicKey.findProgramAddress(
      [rewardMint.toBuffer()],
      unlocStakingPid
    );

    const currentVotingNum = new anchor.BN(0);
    //const currentVotingKey = await getVotingKeyFromNum(currentVotingNum)
    console.log("Global state: ", globalState.toBase58())
    console.log("Super owner: ", superOwner.toBase58())
    console.log("Reward mint: ", rewardMint.toBase58())
    console.log("Reward vault: ", rewardVault.toBase58())
    console.log("Treasury: ", treasury.toBase58())

    const signers = [superOwnerKeypair]
    const tx = await program.methods.setGlobalState(accruedInterestNumerator, denominator, minRepaidNumerator, aprNumerator, expireLoanDuration, rewardRate, lenderRewardsPercentage)
      .accounts({
        superOwner: superOwner,
        payer: superOwner,
        globalState: globalState,
        rewardMint: rewardMint,
        rewardVault: rewardVault,
        newSuperOwner: superOwner,
        treasuryWallet: treasury,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('setGlobalState tx = ', tx)

    // assertions
    let globalStateData = await program.account.globalState.fetch(globalState)
    assert(globalStateData.superOwner == superOwner)
    assert(globalStateData.treasuryWallet == treasury)
    assert(globalStateData.rewardVault == rewardVault)
    assert(globalStateData.accruedInterestNumerator.toNumber() == accruedInterestNumerator.toNumber(), "accruedInterestNumerator")
    assert(globalStateData.denominator.toNumber() == denominator.toNumber(), "denominator")
    assert(globalStateData.aprNumerator.toNumber() == aprNumerator.toNumber(), "aprNumerator")

  })
});

async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
  while (await connection.getBalance(key) < amount * 1000000000){
    try{
      await connection.confirmTransaction(
        await connection.requestAirdrop(key, 1000000000),
        "confirmed"
      );
    }catch{}
  };
}

async function pda(seeds: (Buffer | Uint8Array)[], programId: anchor.web3.PublicKey) {
  const [pdaKey] =
    await anchor.web3.PublicKey.findProgramAddress(
      seeds,
      programId,
    );
  return pdaKey
}
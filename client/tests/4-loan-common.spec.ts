
import {
  acceptLoanOfferByVoting,
  cancelLoanOffer,
  cancelLoanSubOffer,
  initLoanProgram,
  repayLoan,
  setLoanGlobalState,
  setLoanOffer,
  createLoanSubOffer,
  claimLoanCollateral,
  getLastVotingKey,
  setVotingItem,
  getVotingItemKey,
  getVotingItem,
  getCurrentVotingKey,
  depositRewards,
  claimRewards,
  createLoanSubOfferByStaking,
  checkWalletATA,
  acceptLoanOffer,
  setLoanStakingPool,
  setLoanVoting,
  getVotingKeyFromNum
} from '../src'
import * as anchor from '@project-serum/anchor';

import { assert } from 'chai'
import { UnlocLoan } from '../src/types/unloc_loan';

import SUPER_OWNER_WALLET from './test-users/super_owner.json'
import PROPOSER1_WALLET from './test-users/borrower1.json'
import LOANER1_WALLET from './test-users/lender1.json'
import TREASURY from './test-users/treasury.json'
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT, VOTING_PID } from '../src';
import { Collection, CreateMasterEditionV3, CreateMetadataV2, DataV2, Edition, Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { mintAndCreateMetadata, mintAndCreateMetadataV2 } from '@metaplex-foundation/mpl-token-metadata/dist/test/actions';
import { Keypair } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

describe('loan-common', () => {

  const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
  const superOwner = superOwnerKeypair.publicKey;
  const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
  const borrower = borrowerKeypair.publicKey;
  const lender1Keypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LOANER1_WALLET))
  const lender1 = lender1Keypair.publicKey;
  const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
  const treasury = treasuryKeypair.publicKey;

  // Configure the client to use the local cluster.
  const envProvider = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
  anchor.setProvider(provider);

  const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;

  const programId = program.programId

  initLoanProgram((program.provider as any).wallet, program.provider.connection, programId)
  const systemProgram = anchor.web3.SystemProgram.programId
  const tokenProgram = TOKEN_PROGRAM_ID
  const rent = anchor.web3.SYSVAR_RENT_PUBKEY
  const clock = anchor.web3.SYSVAR_CLOCK_PUBKEY
  const defaults = {
    systemProgram,
    tokenProgram,
    rent,
    clock
  }

  const GLOBAL_STATE_SEED = Buffer.from("GLOBAL_STATE_SEED");
  const OFFER_SEED = Buffer.from("OFFER_SEED");
  const SUB_OFFER_SEED = Buffer.from("SUB_OFFER_SEED");
  const REWARD_VAULT_SEED = Buffer.from("REWARD_VAULT_SEED");
  const OFFER_VAULT_SEED = Buffer.from("OFFER_VAULT_SEED");
  const TREASURY_VAULT_SEED = Buffer.from("TREASURY_VAULT_SEED");
  const USER_REWARD_TAG = Buffer.from('LENDER_REWARD_SEED')

  

  let nftMint: Token = null as any;
  let nftMetadataKey: anchor.web3.PublicKey = null as any;
  let nftEditionKey: anchor.web3.PublicKey = null as any;
  const collectionKey = Keypair.generate().publicKey
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

  it('Is initialized!', async () => {

    await safeAirdrop(program.provider.connection, superOwner, 10)
    await safeAirdrop(program.provider.connection, borrower, 10)
    await safeAirdrop(program.provider.connection, lender1, 10)
    await safeAirdrop(program.provider.connection, treasury, 10)

    nftMint = await Token.createMint(
      program.provider.connection,
      superOwnerKeypair,
      superOwner,
      superOwner,
      0,
      TOKEN_PROGRAM_ID
    );

    const dataV2 = new DataV2({
      name: 'Test NFT',
      symbol: 'TNFT',
      uri: '',
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: new Collection({
        key: collectionKey.toBase58(),
        verified: false
      }),
      uses: null
    })
    nftMetadataKey = await Metadata.getPDA(nftMint.publicKey)
    const createMetadataTx = new CreateMetadataV2({ feePayer: superOwner }, {
      metadata: nftMetadataKey,
      metadataData: dataV2,
      updateAuthority: superOwner,
      mint: nftMint.publicKey,
      mintAuthority: superOwner
    })
    const tx = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createMetadataTx, [superOwnerKeypair])
    console.log('creating nft meta tx = ', tx)

    borrowerNftVault = await nftMint.createAccount(borrower);
    lenderNftVault = await nftMint.createAccount(lender1);
    await nftMint.mintTo(
      borrowerNftVault,
      superOwner,
      [],
      1
    );

    // Create master edition after nft mint
    nftEditionKey = await Edition.getPDA(nftMint.publicKey)
    const createEditionTx = new CreateMasterEditionV3({ feePayer: superOwner }, {
      edition: nftEditionKey,
      metadata: nftMetadataKey,
      mint: nftMint.publicKey,
      updateAuthority: superOwner,
      mintAuthority: superOwner,
      maxSupply: 0
    })
    try {
      const tx2 = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createEditionTx, [superOwnerKeypair])
      console.log('creating nft edition tx = ', tx2)
    }
    catch (e) {
      console.log(e);
    }

    offerMint = new Token(program.provider.connection, USDC_MINT, TOKEN_PROGRAM_ID, superOwnerKeypair);

    borrowerOfferVault = await offerMint.createAccount(borrower);
    lenderOfferVault = await offerMint.createAccount(lender1);
    await offerMint.mintTo(
      borrowerOfferVault,
      superOwner,
      [],
      10000 * offerDecimal, //10000
    );
    await offerMint.mintTo(
      lenderOfferVault,
      superOwner,
      [],
      10000 * offerDecimal, //10000
    );

    const rewardToken = new Token(program.provider.connection, rewardMint, TOKEN_PROGRAM_ID, superOwnerKeypair);
    rewardVaultOfSuperOwner = await rewardToken.createAccount(superOwner);
    await rewardToken.mintTo(
      rewardVaultOfSuperOwner,
      superOwner,
      [],
      1000000 * 10 ** 6, //1000000 UNLOC
    );
  })


  it('Set global state', async () => {
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
    const currentVotingKey = await getVotingKeyFromNum(currentVotingNum)
    const globalState = await pda([GLOBAL_STATE_SEED], programId)

    const signers = [superOwnerKeypair]
    await setLoanGlobalState(
      accruedInterestNumerator,
      denominator,
      minRepaidNumerator,
      aprNumerator,
      expireLoanDuration,
      rewardRate,
      lenderRewardsPercentage,
      rewardMint,
      treasury,
      superOwner,
      superOwner,
      signers
    )

    // assert
    let globalStateData = await program.account.globalState.fetch(globalState)
    assert(globalStateData.accruedInterestNumerator.toNumber() == accruedInterestNumerator.toNumber(), "accruedInterestNumerator")
    assert(globalStateData.denominator.toNumber() == denominator.toNumber(), "denominator")
    assert(globalStateData.aprNumerator.toNumber() == aprNumerator.toNumber(), "aprNumerator")

    await setLoanStakingPool(
      unlocStakingPoolId,
      superOwner,
      signers
    )
    // assert
    globalStateData = await program.account.globalState.fetch(globalState)
    assert(globalStateData.unlocStakingPoolId.equals(unlocStakingPoolId), "unlocStakingPoolId")

    await setLoanVoting(
      currentVotingKey,
      superOwner,
      signers
    )
    // assert
    globalStateData = await program.account.globalState.fetch(globalState)
    assert(globalStateData.voting.equals(currentVotingKey), "currentVotingKey")
  });

  it('Deposit rewards', async () => {
    const amount = new BN(1000 * 10 ** 6)
    const signers = [superOwnerKeypair]
    await depositRewards(
      amount,
      superOwner,
      signers
    );
  });

  it('Set offer', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const signers = [borrowerKeypair]
    await setLoanOffer(nftMint.publicKey, borrower, signers)

    //assert
    const offerData = await program.account.offer.fetch(offer)
    assert(offerData.borrower.equals(borrower), "borrower")
    assert(offerData.nftMint.equals(nftMint.publicKey), "nftMint")
    assert(offerData.state == OfferState.Proposed, "state")

    // Check nft status
    const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
    const tokenInfo = await nftMint.getAccountInfo(borrowerNftATA);
    assert(offer.equals(tokenInfo.delegate as any), "nft delegate")
    assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")
    assert.equal(tokenInfo.isFrozen, true, "nft frozen")
  });

  it('Cancel offer', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const signers = [borrowerKeypair]
    await cancelLoanOffer(nftMint.publicKey, borrower, signers)
    //assert
    const offerData = await program.account.offer.fetch(offer)
    assert(offerData.borrower.equals(borrower), "borrower")
    assert(offerData.nftMint.equals(nftMint.publicKey), "nftMint")
    assert(offerData.state == OfferState.Canceled, "state")

    // Check nft status    
    const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
    const tokenInfo = await nftMint.getAccountInfo(borrowerNftATA);
    assert.equal(tokenInfo.isFrozen, false, "nft thaw")
    assert.equal(tokenInfo.delegate, null, "nft delegate")
    assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")

    // Call set offer for continue test
    await setLoanOffer(nftMint.publicKey, borrower, [borrowerKeypair])
  });

  let loanDuration = new anchor.BN(10) //10s
  it('Set sub offer 1', async () => {

    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const offerAmount = new anchor.BN(10 * offerDecimal)
    const aprNumerator = new anchor.BN(12 * denominator.toNumber() / 100)
    const signers = [borrowerKeypair]
    await createLoanSubOfferByStaking(
      offerAmount,
      loanDuration,
      aprNumerator,
      nftMint.publicKey,
      offerMint.publicKey,
      borrower,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.subOfferNumber.toNumber() == subOfferNumer.toNumber(), "subOfferNumer")
    assert(subOfferData.offer.equals(offer), "offer")
    assert(subOfferData.offerMint.equals(offerMint.publicKey), "offerMint")
    assert(subOfferData.loanDuration.toNumber() == loanDuration.toNumber(), "loanDuration")
    assert(subOfferData.aprNumerator.toNumber() == aprNumerator.toNumber(), "aprNumerator")
  });

  it('Cancel sub offer', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const signers = [borrowerKeypair]
    await cancelLoanSubOffer(
      subOffer,
      borrower,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.state == SubOfferState.Canceled, "state")
  });

  it('Set sub offer 2', async () => {

    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const offerAmount = new anchor.BN(10 * offerDecimal)
    const aprNumerator = new anchor.BN(12 * denominator.toNumber() / 100)
    const signers = [borrowerKeypair]
    await createLoanSubOfferByStaking(
      offerAmount,
      loanDuration,
      aprNumerator,
      nftMint.publicKey,
      offerMint.publicKey,
      borrower,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.subOfferNumber.toNumber() == subOfferNumer.toNumber(), "subOfferNumer")
    assert(subOfferData.offer.equals(offer), "offer")
    assert(subOfferData.offerMint.equals(offerMint.publicKey), "offerMint")
    assert(subOfferData.loanDuration.toNumber() == loanDuration.toNumber(), "loanDuration")
    assert(subOfferData.aprNumerator.toNumber() == aprNumerator.toNumber(), "aprNumerator")
  });

  it('Accept offer 1', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const signers = [lender1Keypair]
    await acceptLoanOffer(
      subOffer,
      lender1,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.state == SubOfferState.Accepted, "state")
  });

  it('Repay loan', async () => {
    const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)
    const signers = [borrowerKeypair]
    await repayLoan(
      subOffer,
      borrower,
      signers
    )
    //assert
    const offerData = await program.account.offer.fetch(offer)
    assert(offerData.state == OfferState.NFTClaimed, "offer state")

    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.state == SubOfferState.NFTClaimed, "suboffer state")

    // Check nft holder
    const tokenInfo = await nftMint.getAccountInfo(borrowerNftATA);
    assert.equal(tokenInfo.isFrozen, false, "nft not frozen")
    assert.equal(tokenInfo.delegate, null, "nft delegate")
    assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")

    // Call set offer for continue test
    await setLoanOffer(nftMint.publicKey, borrower, [borrowerKeypair])
  });

  loanDuration = new anchor.BN(1) //10s
  it('Set sub offer 3', async () => {

    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const offerAmount = new anchor.BN(10 * offerDecimal)
    const aprNumerator = new anchor.BN(12 * denominator.toNumber() / 100)
    const signers = [borrowerKeypair]
    await createLoanSubOfferByStaking(
      offerAmount,
      loanDuration,
      aprNumerator,
      nftMint.publicKey,
      offerMint.publicKey,
      borrower,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.subOfferNumber.toNumber() == subOfferNumer.toNumber(), "subOfferNumer")
    assert(subOfferData.offer.equals(offer), "offer")
    assert(subOfferData.offerMint.equals(offerMint.publicKey), "offerMint")
    assert(subOfferData.loanDuration.toNumber() == loanDuration.toNumber(), "loanDuration")
    assert(subOfferData.aprNumerator.toNumber() == aprNumerator.toNumber(), "aprNumerator")
  });

  it('Set VotingItem', async () => {
    const signers = [superOwnerKeypair]
    const votingKey = await getCurrentVotingKey();
    await setVotingItem(
      collectionKey,
      votingKey,
      superOwner,
      signers
    )
    const votingItemKey = await getVotingItemKey(collectionKey, votingKey)
    const votingItem = await getVotingItem(votingItemKey)
    assert.ok(votingItem.key.equals(collectionKey))
    assert.ok(votingItem.voting.equals(votingKey))
  });

  it('Accept offer 2', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

    const signers = [lender1Keypair]
    await acceptLoanOfferByVoting(
      subOffer,
      lender1,
      signers
    )
    //assert
    const subOfferData = await program.account.subOffer.fetch(subOffer)
    assert(subOfferData.state == SubOfferState.Accepted, "state")
  });

  it('Claim Collateral', async () => {
    await delay(2000)
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)
    const signers = [lender1Keypair]
    await claimLoanCollateral(
      subOffer,
      lender1,
      signers
    )

    const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
    const borrowerNftInfo = await nftMint.getAccountInfo(borrowerNftATA);
    assert.equal((borrowerNftInfo.amount as any).toNumber(), 0, "borrwer nft balance")

    const lenderNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, lender1);
    const lenderNftInfo = await nftMint.getAccountInfo(lenderNftATA);
    assert.equal((lenderNftInfo.amount as any).toNumber(), 1, "lender nft balance")
  });
  it('Claim rewards', async () => {
    const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
    const offerDataBefore = await program.account.offer.fetch(offer)
    const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
    const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)
    await claimRewards(
      subOffer,
      lender1,
      [lender1Keypair]
    );
  });

});

async function safeAirdrop(connection: anchor.web3.Connection, key: anchor.web3.PublicKey, amount: number) {
  while (await connection.getBalance(key) < amount * 1000000000) {
    try {
      await connection.confirmTransaction(
        await connection.requestAirdrop(key, 1000000000),
        "confirmed"
      );
    } catch { }
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

enum OfferState {
  Proposed,
  Accepted,
  Expired,
  Fulfilled,
  NFTClaimed,
  Canceled
}
enum SubOfferState {
  Proposed,
  Accepted,
  Expired,
  Fulfilled,
  LoanPaymentClaimed,
  Canceled,
  NFTClaimed
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

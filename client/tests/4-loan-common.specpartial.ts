
import {
  acceptLoanOfferByVoting,
  deleteLoanOffer,
  deleteLoanSubOffer,
  initLoanProgram,
  repayLoan,
  createLoanGlobalState,
  createLoanOffer,
  createLoanSubOffer,
  claimLoanCollateral,
  getLastVotingKey,
  setVotingItem,
  getVotingItemKey,
  getVotingItem,
  getCurrentVotingKey,
  depositRewards,
  claimLenderRewards,
  createLoanSubOfferByStaking,
  checkWalletATA,
  acceptLoanOffer,
  setLoanStakingPool,
  setLoanVoting,
  getVotingKeyFromNum,
  claimBorrowerRewards
} from '../dist/cjs'
import * as anchor from '@project-serum/anchor';
import { assertError } from './staking-utils';
import { assert } from 'chai'
import { UnlocLoan } from '../dist/cjs/types/unloc_loan';

import SUPER_OWNER_WALLET from './test-users/super_owner.json'
import PROPOSER1_WALLET from './test-users/borrower1.json'
import LOANER1_WALLET from './test-users/lender1.json'
import TREASURY from './test-users/treasury.json'
import { AccountInfo, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { initVotingProgram, STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT, VOTING_PID } from '../dist/cjs';
import { Collection, CreateMasterEditionV3, CreateMetadataV2, DataV2, Edition, Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { mintAndCreateMetadata, mintAndCreateMetadataV2 } from '@metaplex-foundation/mpl-token-metadata/dist/test/actions';
import { Keypair, Connection, SystemProgram, PublicKey, Signer, Commitment } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';

export default () => {
  describe('4-loan-common', () => {

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

    let connection = provider.connection
    const votingConnection = new Connection(connection.rpcEndpoint, { commitment: 'confirmed' })

    initVotingProgram((program.provider as any).wallet, votingConnection, VOTING_PID);

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

      // nftMint = await Token.createMint(
      //   program.provider.connection,
      //   superOwnerKeypair,
      //   superOwner,
      //   superOwner,
      //   0,
      //   TOKEN_PROGRAM_ID
      // );
      const mintAccount = Keypair.generate();
      nftMint = new Token(
        connection,
        mintAccount.publicKey,
        programId,
        superOwnerKeypair,
      );

      // Allocate memory for the account
      const balanceNeeded = await Token.getMinBalanceRentForExemptMint(
        connection,
      );

      const transaction = new anchor.web3.Transaction();
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: superOwner,
          newAccountPubkey: mintAccount.publicKey,
          lamports: balanceNeeded,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        }),
      );

      transaction.add(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mintAccount.publicKey,
          0,
          superOwner,
          superOwner,
        ),
      );

      await (program.provider as anchor.AnchorProvider).sendAndConfirm(transaction, [mintAccount])

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

      borrowerNftVault = await createAccount(
        borrower,
        program.provider as anchor.AnchorProvider,
        [borrowerKeypair],
        nftMint.publicKey
      );

      lenderNftVault = await createAccount(
        lender1,
        program.provider as anchor.AnchorProvider,
        [lender1Keypair],
        nftMint.publicKey
      );

      await mintTo(
        borrowerNftVault,
        superOwner,
        [],
        1,
        nftMint.publicKey,
        program.provider as anchor.AnchorProvider
      );

      // Create master edition after nft mint
      nftEditionKey = await Edition.getPDA(nftMint.publicKey)
      const createEditionTx = new CreateMasterEditionV3({ feePayer: superOwner }, {
        edition: nftEditionKey,
        metadata: nftMetadataKey,
        mint: nftMint.publicKey,
        updateAuthority: superOwner,
        mintAuthority: superOwner,
        maxSupply: new anchor.BN(0)
      })
      try {
        const tx2 = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createEditionTx, [superOwnerKeypair])
        console.log('creating nft edition tx = ', tx2)
      }
      catch (e) {
        console.log(e);
      }

      offerMint = new Token(program.provider.connection, USDC_MINT, TOKEN_PROGRAM_ID, superOwnerKeypair);

      borrowerOfferVault = await createAccount(
        borrower,
        program.provider as anchor.AnchorProvider,
        [borrowerKeypair],
        offerMint.publicKey
      );
      lenderOfferVault = await createAccount(
        lender1,
        program.provider as anchor.AnchorProvider,
        [lender1Keypair],
        offerMint.publicKey
      );
      await mintTo(
        borrowerOfferVault,
        superOwner,
        [],
        10000 * offerDecimal, //10000
        offerMint.publicKey,
        program.provider as anchor.AnchorProvider
      );
      await mintTo(
        lenderOfferVault,
        superOwner,
        [],
        10000 * offerDecimal, //10000
        offerMint.publicKey,
        program.provider as anchor.AnchorProvider
      );

      const rewardToken = new Token(program.provider.connection, rewardMint, TOKEN_PROGRAM_ID, superOwnerKeypair);
      rewardVaultOfSuperOwner = await createAccount(
        superOwner,
        program.provider as anchor.AnchorProvider,
        [superOwnerKeypair],
        rewardToken.publicKey
      );
      await mintTo(
        rewardVaultOfSuperOwner,
        superOwner,
        [],
        1000000 * 10 ** 6, //1000000 UNLOC
        rewardToken.publicKey,
        program.provider as anchor.AnchorProvider
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
      await createLoanGlobalState(
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

    it('Create offer', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const signers = [borrowerKeypair]
      await createLoanOffer(nftMint.publicKey, borrower, signers)

      //assert
      const offerData = await program.account.offer.fetch(offer)
      assert(offerData.borrower.equals(borrower), "borrower")
      assert(offerData.nftMint.equals(nftMint.publicKey), "nftMint")
      assert(offerData.state == OfferState.Proposed, "state")

      // Check nft status
      const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
      const tokenInfo = await getAccountInfo(borrowerNftATA, nftMint.publicKey, provider.connection);
      assert(offer.equals(tokenInfo.delegate as any), "nft delegate")
      assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")
      assert.equal(tokenInfo.isFrozen, true, "nft frozen")
    });

    it('Delete & Create offer 1', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const signers = [borrowerKeypair]
      await deleteLoanOffer(nftMint.publicKey, borrower, signers)
      //assert
      const offerData = await program.account.offer.fetchNullable(offer)
      assert(offerData == null, "deleting is fail")

      // Check nft status    
      const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
      const tokenInfo = await getAccountInfo(borrowerNftATA, nftMint.publicKey, provider.connection);
      assert.equal(tokenInfo.isFrozen, false, "nft thaw")
      assert.equal(tokenInfo.delegate, null, "nft delegate")
      assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")

      // Call create offer for continue test
      await createLoanOffer(nftMint.publicKey, borrower, [borrowerKeypair])
    });

    let loanDuration = new anchor.BN(10) //10s
    it('Create sub offer 1', async () => {

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

    it('Delete sub offer 1', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const signers = [borrowerKeypair]
      await deleteLoanSubOffer(
        subOffer,
        borrower,
        signers
      )
      //assert
      const subOfferData = await program.account.subOffer.fetchNullable(subOffer)
      assert(subOfferData == null, "deleting is fail")
    });

    it('Create sub offer 2', async () => {

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
      const tokenInfo = await getAccountInfo(borrowerNftATA, nftMint.publicKey, provider.connection);
      assert.equal(tokenInfo.isFrozen, false, "nft not frozen")
      assert.equal(tokenInfo.delegate, null, "nft delegate")
      assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")
    });

    it('Delete & Create offer 2', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const signers = [borrowerKeypair]
      await deleteLoanOffer(nftMint.publicKey, borrower, signers)
      //assert
      const offerData = await program.account.offer.fetchNullable(offer)
      assert(offerData == null, "deleting is fail")

      // Check nft status    
      const borrowerNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, borrower);
      const tokenInfo = await getAccountInfo(borrowerNftATA, nftMint.publicKey, provider.connection);
      assert.equal(tokenInfo.isFrozen, false, "nft thaw")
      assert.equal(tokenInfo.delegate, null, "nft delegate")
      assert.equal((tokenInfo.amount as any).toNumber(), 1, "nft balance")

      // Call create offer for continue test
      await createLoanOffer(nftMint.publicKey, borrower, [borrowerKeypair])
    });

    loanDuration = new anchor.BN(1) //10s
    it('Create sub offer 3', async () => {

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
      const borrowerNftInfo = await getAccountInfo(borrowerNftATA, nftMint.publicKey, provider.connection);
      assert.equal((borrowerNftInfo.amount as any).toNumber(), 0, "borrwer nft balance")

      const lenderNftATA = await checkWalletATA(nftMint.publicKey.toBase58(), provider.connection, lender1);
      const lenderNftInfo = await getAccountInfo(lenderNftATA, nftMint.publicKey, provider.connection);
      assert.equal((lenderNftInfo.amount as any).toNumber(), 1, "lender nft balance")
    });

    it('Borrower claim lender rewards (should error)', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const tempLenderRewardsKeypair = Keypair.generate()
      // borrower claims lender's rewards
      let hash = claimLenderRewards(
        subOffer,
        borrower,
        tempLenderRewardsKeypair,
        [borrowerKeypair]
      )
      await assertError(hash, undefined)
    })

    it('Lender claim borrower rewards (should error)', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const tempBorrowerRewardsKeypair = Keypair.generate()
      // lender claims borrower's rewards
      let hash = claimBorrowerRewards(
        subOffer,
        lender1,
        tempBorrowerRewardsKeypair,
        [lender1Keypair]
      )
      await assertError(hash, undefined)
    })

    it('Claim rewards', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const lenderRewardVault = Keypair.generate() 
      // lender claims their rewards
      await claimLenderRewards(
        subOffer,
        lender1,
        lenderRewardVault,
        [lender1Keypair]
      )

      const borrowerRewardVault = Keypair.generate()
      // borrower claims their rewards
      await claimBorrowerRewards(
        subOffer,
        borrower,
        borrowerRewardVault,
        [borrowerKeypair]
      )

      // let lenderBalance = await provider.connection.getTokenAccountBalance(lenderRewardVault.publicKey)
      // let borrowerBalance = await provider.connection.getTokenAccountBalance(borrowerRewardVault.publicKey)
      // console.log("Lender pubkey: ", lenderBalance)
      // console.log("Borrower pubkey: ", borrowerBalance)

    });

    it('Lender claims rewards during cooldown', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const tempLenderRewardsKeypair = Keypair.generate()
      // borrower claims lender's rewards
      let hash = claimLenderRewards(
        subOffer,
        lender1,
        tempLenderRewardsKeypair,
        [lender1Keypair]
      )
      await assertError(hash, undefined)
    })

    it('Borrower claims rewards during cooldown', async () => {
      const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
      const offerDataBefore = await program.account.offer.fetch(offer)
      const subOfferNumer = offerDataBefore.subOfferCount.sub(new anchor.BN(1))
      const subOffer = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumer.toBuffer("be", 8)], programId)

      const tempBorrowerRewardsKeypair = Keypair.generate()
      // lender claims borrower's rewards
      let hash = claimBorrowerRewards(
        subOffer,
        borrower,
        tempBorrowerRewardsKeypair,
        [borrowerKeypair]
      )
      await assertError(hash, undefined)
    })

    it('Update redemption reset time', async () => {
      const globalState = await pda([GLOBAL_STATE_SEED], programId)
      let newRedeemTime = new anchor.BN(4);
      try {
        let txid = await program.methods.setRedeemReset(newRedeemTime)
          .accounts({
            superOwner: superOwner,
            globalState: globalState
          })
          .signers([superOwnerKeypair])
          .rpc()
        console.log('tx = ', txid)
      } catch (e) {
        console.log(e)
        assert.fail()
      }
    })
  })
}

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
async function mintTo(
  dest: PublicKey,
  authority: PublicKey,
  multiSigners: Array<Signer>,
  amount: number | u64,
  mintPublicKey: PublicKey,
  provider: anchor.AnchorProvider
) {
  let ownerPublicKey = authority;
  let signers = multiSigners;
  const transaction = new anchor.web3.Transaction().add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      dest,
      ownerPublicKey,
      multiSigners,
      amount,
    ),
  )
  await provider.sendAndConfirm(transaction, signers)
}
async function createAccount(
  owner: PublicKey,
  provider: anchor.AnchorProvider,
  multiSigners: Array<Signer>,
  mintPublicKey: PublicKey,
){
  const balanceNeeded2 = await Token.getMinBalanceRentForExemptAccount(
    provider.connection,
  );

  const newAccount = Keypair.generate();
  multiSigners.push(newAccount)
  const transaction2 = new anchor.web3.Transaction();
  transaction2.add(
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: newAccount.publicKey,
      lamports: balanceNeeded2,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  transaction2.add(
    Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      newAccount.publicKey,
      owner,
    ),
  );
  await provider.sendAndConfirm(transaction2, multiSigners)
  return newAccount.publicKey
}
async function getAccountInfo(
  account: PublicKey,
  mintPublicKey: PublicKey,
  connection: Connection,
  commitment?: Commitment,
): Promise<AccountInfo> {
  const FAILED_TO_FIND_ACCOUNT = 'Failed to find account';
  const INVALID_ACCOUNT_OWNER = 'Invalid account owner';
  const info = await connection.getAccountInfo(account, commitment);
  if (info === null) {
    throw new Error(FAILED_TO_FIND_ACCOUNT);
  }
  if (!info.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(INVALID_ACCOUNT_OWNER);
  }
  if (info.data.length != AccountLayout.span) {
    throw new Error(`Invalid account size`);
  }

  const data = Buffer.from(info.data);
  const accountInfo = AccountLayout.decode(data);
  accountInfo.address = account;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = u64.fromBuffer(accountInfo.amount);

  if (accountInfo.delegateOption === 0) {
    accountInfo.delegate = null;
    accountInfo.delegatedAmount = new u64(0);
  } else {
    accountInfo.delegate = new PublicKey(accountInfo.delegate);
    accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
  }

  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  if (accountInfo.isNativeOption === 1) {
    accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
    accountInfo.isNative = true;
  } else {
    accountInfo.rentExemptReserve = null;
    accountInfo.isNative = false;
  }

  if (accountInfo.closeAuthorityOption === 0) {
    accountInfo.closeAuthority = null;
  } else {
    accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
  }

  if (!accountInfo.mint.equals(mintPublicKey)) {
    throw new Error(
      `Invalid account mint: ${JSON.stringify(
        accountInfo.mint,
      )} !== ${JSON.stringify(mintPublicKey)}`,
    );
  }
  return accountInfo;
}
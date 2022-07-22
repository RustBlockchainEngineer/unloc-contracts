import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../../keypairs/usdc-token.json'
import { MintLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction, TransactionInstruction, PublicKey, Connection } from '@solana/web3.js';
import { UnlocLoan } from '../../../../src/types/unloc_loan';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT, VOTING_PID, getVotingKeyFromNum, systemProgram } from '../../../../src';
import { defaults } from '../../../../src/global-config'
import { assert, expect } from 'chai';
import { safeAirdrop, pda, createTokenMints, initGlobalStateAccount } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { Keypair } from '@solana/web3.js'
import { Collection, createCreateMetadataAccountV2Instruction, CreateMasterEditionArgs, CreateMasterEditionV3InstructionArgs, createCreateMasterEditionV3Instruction, DataV2,
PROGRAM_ID, CreateMetadataAccountArgsV2, CreateMetadataAccountV2InstructionArgs, createMintNewEditionFromMasterEditionViaVaultProxyInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { setLoanGlobalState } from '../../../../src';

describe('create loan with multiple sub offers', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const superOwner = superOwnerKeypair.publicKey;
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const borrower = borrowerKeypair.publicKey;
    const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
    const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
    const treasury = treasuryKeypair.publicKey;

    //const GLOBAL_STATE_SEED = Buffer.from("GLOBAL_STATE_SEED");
    const GLOBAL_STATE_TAG = Buffer.from('GLOBAL_STATE_SEED')
    const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')
    const OFFER_SEED = Buffer.from("OFFER_SEED")
    const SUB_OFFER_SEED = Buffer.from("SUB_OFFER_SEED")
    const TREASURY_VAULT_TAG = Buffer.from('TREASURY_VAULT_SEED')

    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);

    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
    const programId = program.programId

    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000);
    const lenderRewardsPercentage = new anchor.BN(6000);
    const rewardMint = UNLOC_MINT
    let nftMint: Token = null as any;
    let nftMetadataKey: anchor.web3.PublicKey = null as any;
    let nftEditionKey: anchor.web3.PublicKey = null as any;
    let borrowerNftVault: anchor.web3.PublicKey = null as any;
    const collectionKey = Keypair.generate().publicKey
    const accruedInterestNumerator = new anchor.BN(10000000);
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100); // 1%
    const minRepaidNumerator = new anchor.BN(denominator.toNumber() / 2); // 0.5
    const rewardRate = new anchor.BN(300);
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600);
    const unlocStakingPid = STAKING_PID


    it('Creating token mints', async () => {
        await safeAirdrop(provider.connection, superOwner, 10)
        await createTokenMints(superOwnerKeypair, unlocTokenKeypair, usdcTokenKeypair)
    })

    it('init global state account', async () => {
    /* 
        Declare parameters for the process_set_global_state instruction.
        This instruction initalizes the state of the GlobalState account.
    */

    console.log("Global state: ", globalState.toBase58())
    console.log("Super owner: ", superOwner.toBase58())
    console.log("Reward mint: ", rewardMint.toBase58())
    console.log("Reward vault: ", rewardVault.toBase58())
    console.log("Treasury: ", treasury.toBase58())

    // await initGlobalStateAccount(
    //     globalState,
    //     accruedInterestNumerator,
    //     denominator,
    //     minRepaidNumerator,
    //     aprNumerator,
    //     expireLoanDuration,
    //     rewardRate,
    //     lenderRewardsPercentage,
    //     programId
    // )

    const signers = [superOwnerKeypair]
    const tx = await program.methods.setGlobalState(accruedInterestNumerator, denominator, minRepaidNumerator, aprNumerator, expireLoanDuration, rewardRate, lenderRewardsPercentage)
    .accounts({
    superOwner: superOwner,
    payer: superOwner,
    globalState: globalState,
    rewardMint: unlocTokenKeypair.publicKey,
    rewardVault: rewardVault,
    newSuperOwner: superOwner,
    treasuryWallet: treasury,
    ...defaults
    })
    .signers(signers)
    .rpc()

    
    // assertions
    let globalStateData = await program.account.globalState.fetch(globalState)
    //console.log("globalState: ", globalStateData)
    assert.equal(globalStateData.superOwner.toBase58(), superOwner.toBase58())
    assert.equal(globalStateData.treasuryWallet.toBase58(), treasury.toBase58())
    assert.equal(globalStateData.rewardVault.toBase58(), rewardVault.toBase58())
    assert.equal(globalStateData.accruedInterestNumerator.toNumber(), accruedInterestNumerator.toNumber())
    assert.equal(globalStateData.denominator.toNumber(), denominator.toNumber())
    assert.equal(globalStateData.aprNumerator.toNumber(), aprNumerator.toNumber())
    
    })
    
    it('Create NFT', async () => {
        let nft = await Token.createMint(
          provider.connection,
          superOwnerKeypair,
          superOwner,
          superOwner,
          0,
          TOKEN_PROGRAM_ID
        )
        console.log("nft key: ", nft.publicKey.toBase58())
        const testCollection: Collection = ({
        key: collectionKey,
        verified: false
        })
    
        const dataV2: DataV2 = ({
            name: 'Test NFT',
            symbol: 'TNFT',
            uri: '',
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: testCollection,
            uses: null
        })
    
    //nftMetadataKey = await Metadata.getPDA(nftMint.publicKey)
    let utf8Encode = new TextEncoder();
    let buff = utf8Encode.encode("metadata");
    nftMetadataKey = (await PublicKey.findProgramAddress([buff, nft.publicKey.toBuffer()],
    PROGRAM_ID))[0]
    console.log("meta data key: ", nftMetadataKey.toBase58())
    
    const metadataArgs: CreateMetadataAccountArgsV2 = {
    data: dataV2,
    isMutable: false
    }
    const createMetadatIxArgs: CreateMetadataAccountV2InstructionArgs = {
        createMetadataAccountArgsV2: metadataArgs
    }
    
    if (nftMint != null) {
        const createMetadataIx = createCreateMetadataAccountV2Instruction({
          metadata: nftMetadataKey,
          updateAuthority: superOwner,
          mint: nftMint.publicKey,
          mintAuthority: superOwner,
          payer: superOwner
        },
        createMetadatIxArgs)
    
        const createMetadataTx = new Transaction()
        createMetadataTx.add(createMetadataIx)
    
        const tx = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createMetadataTx, [superOwnerKeypair])
        console.log('creating nft meta tx = ', tx)
    
        // create borrower nft vault
        borrowerNftVault = await nftMint.createAccount(borrower);
    
        // mint to vault
        await nftMint.mintTo(
            borrowerNftVault,
            superOwner,
            [],
            1
        );
    
        // Create master edition after nft mint
        const arg: CreateMasterEditionArgs = {
          maxSupply: 0
        }
        const masterEditionArgs: CreateMasterEditionV3InstructionArgs = { createMasterEditionArgs: arg }
        const createMasterEditionIx = createCreateMasterEditionV3Instruction({
          edition: nftEditionKey,
          metadata: nftMetadataKey,
          mint: nftMint?.publicKey,
          updateAuthority: superOwner,
          mintAuthority: superOwner,
          payer: superOwner
        },
        masterEditionArgs
        )
        const createMasterEdtionTx = new Transaction()
        createMasterEdtionTx.add(createMasterEditionIx)
    
        try {
            const tx2 = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createMasterEdtionTx, [superOwnerKeypair])
            console.log('creating nft edition tx = ', tx2)
        }
        catch (e) {
            console.log(e);
        }
    
      }
    })
    
    it('create loan ofer with NFT', async () => {
        if(nftMint != null) {
        const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)

        try {
            const tx1 = program.methods.setOffer()
            .accounts({
                borrower: borrower,
                payer: borrower,
                offer: offer,
                nftMint: nftMint.publicKey,
                nftMetadata: nftMetadataKey,
                userVault: borrowerNftVault,
                edition: nftEditionKey,
                metadataProgram: TOKEN_META_PID,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            console.log('set Offer tx = ', tx1)
        } catch (e) {
            console.log(e)
        }

        // validations
        const offerData = await program.account.offer.fetch(offer)
        assert.equal(offerData.borrower.toBase58(), borrower.toBase58())
        assert.equal(offerData.nftMint.toBase58(), nftMint.publicKey.toBase58())
        assert.equal(offerData.subOfferCount, 0)
        assert.equal(offerData.subOfferNumber, 0)
        //assert.equal(offerData.state, OfferState.Proposed)

        // need to check status of nft (frozen, delegated, etc...)
        }
    })
    
    it('create first sub offer', async () => {
        if(nftMint != null){
            const offerAmount = 1000
            const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, nftMint.publicKey.toBuffer()], programId)
            try {
            const subOfferTx = program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrower,
                payer: borrower,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasury,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            console.log('set sub offer tx: ', subOfferTx)

            // validations
            const subOfferData = await program.account.offer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(subOfferData.subOfferCount, 1)
            assert.equal(subOfferData.subOfferCount, updatedOfferData.subOfferCount)
            assert.equal(subOfferData.offer, offer)
            assert.equal(subOfferData.nftMint, nftMint.publicKey)
            assert.equal(subOfferData.borrower, borrower)
            assert.equal(subOfferData.offerMint, USDC_MINT)
            assert.equal(subOfferData.offerAmount, offerAmount)
            assert.equal(subOfferData.subOfferNumber, subOfferNumber)
            assert.equal(subOfferData.loanDuration, expireLoanDuration)
            assert.equal(subOfferData.aprNumerator, aprNumerator)
            } catch (e) {
            console.log("Error: ", e)
            }
        }
    })

    it('create 2nd sub offer', async () => {
        if(nftMint != null){
            const offerAmount2 = 2000
            const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, nftMint.publicKey.toBuffer()], programId)
            try {
            const subOfferTx = program.methods.setSubOffer(offerAmount2, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrower,
                payer: borrower,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasury,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            console.log('set sub offer tx: ', subOfferTx)

            // validations
            const subOfferData = await program.account.offer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(subOfferData.subOfferCount, 2)
            assert.equal(subOfferData.subOfferCount, updatedOfferData.subOfferCount)
            assert.equal(subOfferData.offer, offer)
            assert.equal(subOfferData.nftMint, nftMint.publicKey)
            assert.equal(subOfferData.borrower, borrower)
            assert.equal(subOfferData.offerMint, USDC_MINT)
            assert.equal(subOfferData.offerAmount, offerAmount2)
            assert.equal(subOfferData.subOfferNumber, subOfferNumber)
            assert.equal(subOfferData.loanDuration, expireLoanDuration)
            assert.equal(subOfferData.aprNumerator, aprNumerator)
            } catch (e) {
            console.log("Error: ", e)
            }
        }
    })

    it('create 3rd sub offer', async () => {
        if(nftMint != null){
            const offerAmount3 = 3000
            const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, nftMint.publicKey.toBuffer()], programId)
            try {
            const subOfferTx = program.methods.setSubOffer(offerAmount3, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrower,
                payer: borrower,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasury,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            console.log('set sub offer tx: ', subOfferTx)

            // validations
            const subOfferData = await program.account.offer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(subOfferData.subOfferCount, 3)
            assert.equal(subOfferData.subOfferCount, updatedOfferData.subOfferCount)
            assert.equal(subOfferData.offer, offer)
            assert.equal(subOfferData.nftMint, nftMint.publicKey)
            assert.equal(subOfferData.borrower, borrower)
            assert.equal(subOfferData.offerMint, USDC_MINT)
            assert.equal(subOfferData.offerAmount, offerAmount3)
            assert.equal(subOfferData.subOfferNumber, subOfferNumber)
            assert.equal(subOfferData.loanDuration, expireLoanDuration)
            assert.equal(subOfferData.aprNumerator, aprNumerator)
            } catch (e) {
            console.log("Error: ", e)
            }
        }
    })

})
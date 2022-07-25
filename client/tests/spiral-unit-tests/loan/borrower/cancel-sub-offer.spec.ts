import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../../keypairs/usdc-token.json'
import { Token } from '@solana/spl-token'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { TOKEN_META_PID, USDC_MINT } from '../../../../src'
import { defaults } from '../../../../src/global-config'
import { assert } from 'chai'
import { pda, OfferState, SubOfferState, createAndMintNft } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, REWARD_VAULT_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG } from '../../utils/const'

describe('create and cancel sub offer', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
    const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))


    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);

    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
    const programId = program.programId

    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    const lenderRewardsPercentage = new anchor.BN(6000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const accruedInterestNumerator = new anchor.BN(10000000)
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const minRepaidNumerator = new anchor.BN(denominator.toNumber() / 2) // 0.5
    const rewardRate = new anchor.BN(300)
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    it('create loan ofer with NFT', async () => {
        // create nft and mint to borrower's wallet
        let nftObject = await createAndMintNft(borrowerKeypair.publicKey)
        nftMint = nftObject.nft
        nftMetadataKey = nftObject.metadata
        nftEditionKey = nftObject.editionKey
        borrowerNftVault = nftObject.borrowerNftVault

        if(nftMint) {
        const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)

        try {
            const tx1 = await program.methods.setOffer()
            .accounts({
                borrower: borrowerKeypair.publicKey,
                payer: borrowerKeypair.publicKey,
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
            //console.log('set Offer tx = ', tx1)
        } catch (e) {
            console.log("Caught error: ",e)
            assert.fail()
        }

        // validations
        const offerData = await program.account.offer.fetch(offer)
        assert.equal(offerData.borrower.toBase58(), borrowerKeypair.publicKey.toBase58())
        assert.equal(offerData.nftMint.toBase58(), nftMint.publicKey.toBase58())
        assert.equal(offerData.subOfferCount, 0)
        assert.equal(offerData.startSubOfferNum, 0)
        assert.equal(offerData.state, OfferState.Proposed)
        // need to check status of nft (frozen, delegated, etc...)

        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
    it('create 1st sub offer', async () => {
        if(nftMint != null){
            const offerAmount = new anchor.BN(1000)
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)
            try {
            const subOfferTx = await program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrowerKeypair.publicKey,
                payer: borrowerKeypair.publicKey,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasuryKeypair.publicKey,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            //console.log('set 1st sub offer tx: ', subOfferTx)
    
            // validations
            const subOfferData = await program.account.subOffer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(updatedOfferData.subOfferCount, 1)
            assert.equal(subOfferData.offer.toBase58(), offer.toBase58())
            assert.equal(subOfferData.nftMint.toBase58(), nftMint.publicKey.toBase58())
            assert.equal(subOfferData.borrower.toBase58(), borrowerKeypair.publicKey.toBase58())
            assert.equal(subOfferData.offerMint.toBase58(), USDC_MINT.toBase58())
            assert.equal(subOfferData.offerAmount, 1000)
            assert.equal(subOfferData.subOfferNumber.toNumber(), subOfferNumber.toNumber())
            assert.equal(subOfferData.loanDuration.toNumber(), expireLoanDuration.toNumber())
            assert.equal(subOfferData.aprNumerator.toNumber(), aprNumerator.toNumber())
            assert.equal(subOfferData.state, OfferState.Proposed)
            } catch (e) {
            console.log("Caught error: ", e)
            assert.fail()
            }
        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
    it('cancel first sub offer', async () => {
        if(nftMint){
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount.sub(new anchor.BN(1))
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            try {
                const cancelSubOfferTx1 = await program.methods.cancelSubOffer()
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    offer: offer,
                    subOffer: subOfferKey
                })
                .signers([borrowerKeypair])
                .rpc()
                //console.log('cancel 1st sub offer tx: ', cancelSubOfferTx1)

                // validations
                const subOfferData = await program.account.subOffer.fetch(subOfferKey)
                //const updatedOfferData = await program.account.offer.fetch(offer)
                assert.equal(subOfferData.state, SubOfferState.Canceled)
                // don't see this being updated in the code, maybe it doesn't matter since the state is set to canceled
                // wouldn't it make sense to update the offer sub offer count here ?
                // assert.equal(updatedOfferData.subOfferCount, 0)
            } catch (e) {
                console.log("Caught error: ", e)
                assert.fail()
            }
        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
    it('create 2nd sub offer', async () => {
        if(nftMint != null){
            const offerAmount = new anchor.BN(2000)
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)
            try {
            const subOfferTx = await program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrowerKeypair.publicKey,
                payer: borrowerKeypair.publicKey,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasuryKeypair.publicKey,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            //console.log('set 2nd sub offer tx: ', subOfferTx)
    
            // validations
            const subOfferData = await program.account.subOffer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(updatedOfferData.subOfferCount, 2)
            assert.equal(subOfferData.offer.toBase58(), offer.toBase58())
            assert.equal(subOfferData.nftMint.toBase58(), nftMint.publicKey.toBase58())
            assert.equal(subOfferData.borrower.toBase58(), borrowerKeypair.publicKey.toBase58())
            assert.equal(subOfferData.offerMint.toBase58(), USDC_MINT.toBase58())
            assert.equal(subOfferData.offerAmount, 2000)
            assert.equal(subOfferData.subOfferNumber.toNumber(), subOfferNumber.toNumber())
            assert.equal(subOfferData.loanDuration.toNumber(), expireLoanDuration.toNumber())
            assert.equal(subOfferData.aprNumerator.toNumber(), aprNumerator.toNumber())
            assert.equal(subOfferData.state, OfferState.Proposed)
            } catch (e) {
            console.log("Caught error: ", e)
            assert.fail()
            }
        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
    it('create 3rd sub offer', async () => {
        if(nftMint != null){
            const offerAmount = new anchor.BN(3000)
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)
            try {
            const subOfferTx = await program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrowerKeypair.publicKey,
                payer: borrowerKeypair.publicKey,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                treasuryWallet: treasuryKeypair.publicKey,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
            //console.log('set 3rd sub offer tx: ', subOfferTx)
    
            // validations
            const subOfferData = await program.account.subOffer.fetch(subOfferKey)
            const updatedOfferData = await program.account.offer.fetch(offer)
            assert.equal(updatedOfferData.subOfferCount, 3)
            assert.equal(subOfferData.offer.toBase58(), offer.toBase58())
            assert.equal(subOfferData.nftMint.toBase58(), nftMint.publicKey.toBase58())
            assert.equal(subOfferData.borrower.toBase58(), borrowerKeypair.publicKey.toBase58())
            assert.equal(subOfferData.offerMint.toBase58(), USDC_MINT.toBase58())
            assert.equal(subOfferData.offerAmount, 3000)
            assert.equal(subOfferData.subOfferNumber.toNumber(), subOfferNumber.toNumber())
            assert.equal(subOfferData.loanDuration.toNumber(), expireLoanDuration.toNumber())
            assert.equal(subOfferData.aprNumerator.toNumber(), aprNumerator.toNumber())
            assert.equal(subOfferData.state, OfferState.Proposed)
            } catch (e) {
            console.log("Caught error: ", e)
            assert.fail()
            }
        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
    it('cancel 2nd sub offer', async () => {
        if(nftMint){
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount.sub(new anchor.BN(1))
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            try {
                const cancelSubOfferTx1 = await program.methods.cancelSubOffer()
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    offer: offer,
                    subOffer: subOfferKey
                })
                .signers([borrowerKeypair])
                .rpc()
                //console.log('cancel 2nd sub offer tx: ', cancelSubOfferTx1)

                // validations
                const subOfferData = await program.account.subOffer.fetch(subOfferKey)
                //const updatedOfferData = await program.account.offer.fetch(offer)
                assert.equal(subOfferData.state, SubOfferState.Canceled)
                // don't see this being updated in the code, maybe it doesn't matter since the state is set to canceled
                // wouldn't it make sense to update the offer sub offer count here ?
                // assert.equal(updatedOfferData.subOfferCount, 0)
            } catch (e) {
                console.log("Caught error: ", e)
                assert.fail()
            }
        } else {
            console.log("mint account null")
            assert.fail()
        }
    })
})
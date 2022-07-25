import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import LENDER from '../../../test-users/lender1.json'
import { Token } from '@solana/spl-token'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { TOKEN_META_PID, USDC_MINT } from '../../../../src'
import { defaults, chainlinkIds } from '../../../../src/global-config'
import { assert, expect } from 'chai'
import { pda, OfferState, createAndMintNft, SubOfferState, findAssociatedTokenAddress, createATA, mintTokens } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG } from '../../utils/const'
import { checkWalletATA } from '../../../../src'
import { TransactionInstruction } from '@solana/web3.js'

describe('lender accepts proposed loan offer', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
    const lenderKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LENDER))
  
    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env()
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);

    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>
    const programId = program.programId

    const globalState = await pda([GLOBAL_STATE_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    it('setup for loan acceptance test', async () => {
        // create nft and mint to borrower's wallet
        let nftObject = await createAndMintNft(borrowerKeypair.publicKey)
        nftMint = nftObject.nft
        nftMetadataKey = nftObject.metadata
        nftEditionKey = nftObject.editionKey
        borrowerNftVault = nftObject.borrowerNftVault

        if(nftMint) {
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            // create loan offer with NFT
            try {
                await program.methods.setOffer()
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
            } catch (e) {
                console.log("Caught error: ",e)
                assert.fail()
            }
            const offerAmount = new anchor.BN(1000)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
            const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)
            // create sub offer for lender to accept
            try {
                await program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
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
            } catch (e) {
                console.log("Caught error: ", e)
                assert.fail()
            }
        } else {
        console.log("mint account null")
        assert.fail()
        }
    })

    it('lender accepts sub offer', async () => {
        const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
        const offerData = await program.account.offer.fetch(offer)
        const subOfferNumber = offerData.subOfferCount.sub(new anchor.BN(1))
        const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)
        const subOfferData = await program.account.subOffer.fetch(subOfferKey)
        let borrowerOfferVault = await findAssociatedTokenAddress(borrowerKeypair.publicKey, USDC_MINT)
        let lenderOfferVault = await findAssociatedTokenAddress(lenderKeypair.publicKey, USDC_MINT)

        // mint tokens of offer mint to lender's associated token address (lender offer vault)
        await mintTokens(lenderKeypair, USDC_MINT, subOfferData.offerAmount.toNumber())
        console.log("tokens minted")

        let borrowerOfferAcct = await provider.connection.getAccountInfo(borrowerOfferVault)
        let lenderOfferAcct = await provider.connection.getAccountInfo(lenderOfferVault)
        let preInstructions: TransactionInstruction[] = []

        if(!borrowerOfferAcct){
            preInstructions = await createATA(borrowerKeypair, USDC_MINT)
            console.log("creating ata")
        }
        if(!lenderOfferAcct){
            console.log("lender does not have token account for this offer's mint")
            assert.fail()
        }
        try {
            console.log("sending tx to loan program")
            const lenderAccpet = await program.methods.acceptOffer()
            .accounts({
                lender: lenderKeypair.publicKey,
                borrower: borrowerKeypair.publicKey,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey,
                offerMint: USDC_MINT,
                borrowerOfferVault: borrowerOfferVault,
                lenderOfferVault: lenderOfferVault,
                ...chainlinkIds,
                ...defaults
            })
            .preInstructions(preInstructions)
            .signers([lenderKeypair, borrowerKeypair])
            .rpc()

            // validations
            let acceptedSubOffer = await program.account.subOffer.fetch(subOfferKey)
            assert.equal(acceptedSubOffer.state, SubOfferState.Accepted)
            // check user ata balance
            // check nft is frozen after offer accpeted

        } catch (e) {
            console.log("Caught error: ", e)
            assert.fail()
        }

    })
})
import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import { Token } from '@solana/spl-token'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { TOKEN_META_PID, USDC_MINT } from '../../../../src'
import { defaults } from '../../../../src/global-config'
import { assert } from 'chai'
import { pda, OfferState, SubOfferState, createAndMintNft } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG } from '../../utils/const'
import { token } from '@metaplex-foundation/js'

/**
 * Test focuses on cancelling one of many sub offers on a loan by targeting the process_cancel_sub_offer instruction in the
 * unloc_loan program.
 * Assertions:
 * - canceled sub offer state updated to 'Canceled'
 * - other sub offer's state still set to 'Proposed'
 * - NFT token account is frozen
 * - NFT delegate == offer
 */

describe('create and cancel sub offer', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))


    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env()
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider)
    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>
    const programId = program.programId

    // derive global state pda
    const globalState = await pda([GLOBAL_STATE_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    it('Create multiple sub offers and cancel', async () => {
        // create nft and mint to borrower's wallet
        let nftObject = await createAndMintNft(borrowerKeypair.publicKey)
        nftMint = nftObject.nft
        nftMetadataKey = nftObject.metadata
        nftEditionKey = nftObject.editionKey
        borrowerNftVault = nftObject.borrowerNftVault

        const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
        const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)

        if(nftMint) {
            try {
                // creating loan offer
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
        } else {
            console.log("mint account null")
            assert.fail()
        }

        try {
            const offerAmount = new anchor.BN(1000)
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)

            // create first sub offer
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
            console.log("Error creating first suboffer: ", e)
            assert.fail()
        }

        try {
            const offerAmount2 = new anchor.BN(2000)
            const offerData2 = await program.account.offer.fetch(offer)
            const subOfferNumber2 = offerData2.subOfferCount
            const subOfferKey2 = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber2.toBuffer("be", 8)], programId)

            // create second sub offer
            await program.methods.setSubOffer(offerAmount2, subOfferNumber2, expireLoanDuration, aprNumerator)
            .accounts({
                borrower: borrowerKeypair.publicKey,
                payer: borrowerKeypair.publicKey,
                globalState: globalState,
                offer: offer,
                subOffer: subOfferKey2,
                offerMint: USDC_MINT,
                treasuryWallet: treasuryKeypair.publicKey,
                treasuryVault: treasuryVault,
                ...defaults
            })
            .signers([borrowerKeypair])
            .rpc()
        } catch (e) {
            console.log("Error creating second suboffer: ", e)
            assert.fail()
        }

        try {
            const offerData = await program.account.offer.fetch(offer)
            const subOfferNumber = offerData.subOfferCount.sub(new anchor.BN(1))
            const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toBuffer("be", 8)], programId)

            // cancel latest sub offer
            await program.methods.cancelSubOffer()
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    offer: offer,
                    subOffer: subOfferKey
                })
                .signers([borrowerKeypair])
                .rpc()

                // validations
                const subOfferData = await program.account.subOffer.fetch(subOfferKey)
                const tokenInfo = await nftMint.getAccountInfo(borrowerNftVault)
                const subOfferNumber1 = offerData.subOfferCount.sub(new anchor.BN(2))
                const subOfferKey1 = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber1.toBuffer("be", 8)], programId)
                const firstSubOfferData = await program.account.subOffer.fetch(subOfferKey1)
                //const updatedOfferData = await program.account.offer.fetch(offer)

                assert.equal(subOfferData.state, SubOfferState.Canceled)
                assert.equal(firstSubOfferData.state, SubOfferState.Proposed)
                assert.equal(tokenInfo.isFrozen, true)
                assert.equal(tokenInfo.delegate.toBase58(), offer.toBase58())
                // don't see this being updated in the code, maybe it doesn't matter since the state is set to canceled
                // wouldn't it make sense to update the offer sub offer count here ?
                // assert.equal(updatedOfferData.subOfferCount, 0)
        } catch (e) {
            console.log("Error cancelling sub offer: ", e)
            assert.fail()
        }
    })
})
import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import { Token } from '@solana/spl-token';
import { UnlocLoan } from '../../../../src/types/unloc_loan';
import { TOKEN_META_PID, USDC_MINT } from '../../../../src';
import { defaults } from '../../../../src/global-config'
import { assert } from 'chai';
import { pda, createAndMintNft, SubOfferState } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG } from '../../utils/const'

/**
 * Test focuses creating a ub offer by targeting the process_set_sub_offer instructions
 * in the unloc_loan program. 
 * Assertions:
 * - sub offer count incremented by 1
 * - sub offer offer == offer address
 * - sub offer nft mint == nft mint
 * - sub offer borrower == borrower pubkey
 * - sub offer mint == mint passed in ix
 * - parameters of proposed loan initialized properly
 * - sub offer state initalized to 'Proposed'
 */

describe('create loan and sub offer', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))

    
    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);
    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
    const programId = program.programId

    // derive global state account
    const globalState = await pda([GLOBAL_STATE_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    it('create single sub offer on loan', async () => {
        // create nft and mint to borrower's wallet
        let nftObject = await createAndMintNft(borrowerKeypair.publicKey)
        nftMint = nftObject.nft
        nftMetadataKey = nftObject.metadata
        nftEditionKey = nftObject.editionKey
        borrowerNftVault = nftObject.borrowerNftVault

        // derive offer address
        const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)

        if(nftMint) {
            // create offer with minted NFT
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
            try {
                const offerData = await program.account.offer.fetch(offer)
                const offerAmount = new anchor.BN(1000)
                const subOfferNumber = offerData.subOfferCount
                const subOfferKey = await pda([SUB_OFFER_SEED, offer.toBuffer(), subOfferNumber.toArrayLike(Buffer, 'be', 8)], programId)
                const treasuryVault = await pda([TREASURY_VAULT_TAG, USDC_MINT.toBuffer()], programId)

                // create sub offer with loan parameters
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

                // validations on sub offer information
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
                assert.equal(subOfferData.state, SubOfferState.Proposed)
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
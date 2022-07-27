import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { UnlocLoan } from '../../../../src/types/unloc_loan';
import { TOKEN_META_PID } from '../../../../src';
import { defaults } from '../../../../src/global-config'
import { assert } from 'chai';
import { pda, OfferState, createAndMintNft } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { SYSTEM_PROGRAM_ID } from '@unloc-dev/raydium-sdk';
import { OFFER_SEED } from '../../utils/const'

/**
 * Still a work in progres...
 * 
 * Test focuses on cancelling a proposed loan offer by targeting the process_cancel_offer instruction in the unloc_loan program.
 * Assertions:
 * - loan offer account's state has been updated to 'Canceled'
 * - NFT account is thawed and no longer frozen
 * - NFT delegate == Offer account
 */

describe('create loan offer and cancel', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))

    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);
    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
    const programId = program.programId

    // define constants
    let nftMint: Token = null as any;
    let nftMetadataKey: anchor.web3.PublicKey = null as any;
    let nftEditionKey: anchor.web3.PublicKey = null as any;
    let borrowerNftVault: anchor.web3.PublicKey = null as any;


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
                // set loan offer with NFT
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
                // cancel offer
                await program.methods.cancelOffer()
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    offer: offer,
                    nftMint: nftMint.publicKey,
                    userVault: borrowerNftVault,
                    edition: nftEditionKey,
                    metadataProgram: TOKEN_META_PID,
                    systemProgram: SYSTEM_PROGRAM_ID,
                    tokenProgram: TOKEN_PROGRAM_ID
                })
                .signers([borrowerKeypair])
                .rpc()

                // validations
                const offerData = await program.account.offer.fetch(offer)
                const tokenInfo = await nftMint.getAccountInfo(borrowerNftVault)

                assert.equal(offerData.state, OfferState.Canceled)
                assert.equal(tokenInfo.isFrozen, false)
                assert.equal(tokenInfo.delegate.toBase58(), offer.toBase58())
            } catch (e) {
                console.log("Caught error: ", e)
                assert.fail()
            }
        } else {
            console.log("nft account null")
            assert.fail()
        }
    })
})
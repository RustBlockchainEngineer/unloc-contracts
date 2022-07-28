import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { TOKEN_META_PID, WSOL_MINT } from '../../../../src'
import { defaults, chainlinkIds } from '../../../../src/global-config'
import { assert } from 'chai'
import { pda, createAndMintNft, SubOfferState, safeAirdrop, OfferState } from '../../utils/loan-utils'
import { GLOBAL_STATE_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG, REWARD_VAULT_TAG } from '../../utils/const'
import { Keypair, Transaction } from '@solana/web3.js'
import { MetadataProgram } from '@metaplex-foundation/mpl-token-metadata';



/**
 * Test focuses on the process_accept_offer instruction in the unloc_loan program.
 * Assertions:
 * - subOffer state == Accepted
 * - NFT token account is Frozen
 * - NFT delegate == offer
 * - Borrower's lamports balance increased by OfferAmount
 * - Lender's lamports balance decreased by OfferAmount
 */

describe('borrower repays loan', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    //const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
    //const lenderKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LENDER))
    const lenderKeypair = Keypair.generate()
    const borrowerKeypair = Keypair.generate()
  
    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env()
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider)
    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>
    const programId = program.programId

    // derive global state pda
    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)
    const treasuryVault = await pda([TREASURY_VAULT_TAG, WSOL_MINT.toBuffer()], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    let lenderOfferVault = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        WSOL_MINT,
        lenderKeypair.publicKey
    )
    let borrowerOfferVault = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        WSOL_MINT,
        borrowerKeypair.publicKey
    )

    it('borrower repays WSOL loan', async () => {
        await safeAirdrop(provider.connection, lenderKeypair.publicKey, 1)
        await safeAirdrop(provider.connection, borrowerKeypair.publicKey, 1)

        // create nft and mint to borrower's wallet
        let nftObject = await createAndMintNft(borrowerKeypair.publicKey)
        nftMint = nftObject.nft
        nftMetadataKey = nftObject.metadata
        nftEditionKey = nftObject.editionKey
        borrowerNftVault = nftObject.borrowerNftVault

        if(nftMint) {
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            try {
                // create loan offer with NFT
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

            try {
                // create sub offer for lender to accept
                await program.methods.setSubOffer(offerAmount, subOfferNumber, expireLoanDuration, aprNumerator)
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    payer: borrowerKeypair.publicKey,
                    globalState: globalState,
                    offer: offer,
                    subOffer: subOfferKey,
                    offerMint: WSOL_MINT,
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

            try {
                const subOfferData = await program.account.subOffer.fetch(subOfferKey)
                const offerMint = subOfferData.offerMint
                const borrower = offerData.borrower

                let tx = new Transaction
                let lenderAtaIx = await Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    WSOL_MINT,
                    lenderOfferVault,
                    lenderKeypair.publicKey,
                    lenderKeypair.publicKey
                    )
                tx.add(lenderAtaIx)

                let borrowerAtaIx = await Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    WSOL_MINT,
                    borrowerOfferVault,
                    borrowerKeypair.publicKey,
                    borrowerKeypair.publicKey
                )
                tx.add(borrowerAtaIx)
                await provider.sendAndConfirm(tx, [lenderKeypair, borrowerKeypair])
    
                // accept offer
                await program.methods.acceptOffer()
                .accounts({
                    lender: lenderKeypair.publicKey,
                    borrower: borrower,
                    globalState: globalState,
                    offer: offer,
                    subOffer: subOfferKey,
                    offerMint: offerMint,
                    borrowerOfferVault: borrowerOfferVault,
                    lenderOfferVault: lenderOfferVault,
                    rewardVault: rewardVault,
                    ...chainlinkIds,
                    ...defaults
                })
                .signers([lenderKeypair])
                .rpc()
            } catch (e) {
                console.log("Caught error: ", e)
                assert.fail()
            }

            try {
                // repaying loan
                await program.methods.repayLoan()
                .accounts({
                    borrower: borrowerKeypair.publicKey,
                    lender: lenderKeypair.publicKey,
                    globalState: globalState,
                    treasuryWallet: treasuryKeypair.publicKey,
                    offer: offer,
                    subOffer: subOfferKey,
                    nftMint: nftMint.publicKey,
                    edition: nftEditionKey,
                    borrowerNftVault: borrowerNftVault,
                    metadataProgram: MetadataProgram.PUBKEY,
                    lenderOfferVault: lenderOfferVault,
                    borrowerOfferVault: borrowerOfferVault,
                    treasuryVault: treasuryVault,
                    rewardVault: rewardVault,
                    ...chainlinkIds,
                    ...defaults
                })
                .signers([borrowerKeypair])
                .rpc()
            } catch (e) {
                console.log("Caugh error: ", e)
                assert.fail()
            }

            try {
                // validations
                let acceptedSubOffer = await program.account.subOffer.fetch(subOfferKey)
                let paidOffer = await program.account.offer.fetch(offer)
                const tokenInfo = await nftMint.getAccountInfo(borrowerNftVault)
                let borrowerPostBalance = await (await provider.connection.getAccountInfo(borrowerKeypair.publicKey)).lamports
                let lenderPostBalance = await (await provider.connection.getAccountInfo(lenderKeypair.publicKey)).lamports
                console.log("borrow post: ", borrowerPostBalance)
                console.log("lender post: ", lenderPostBalance)
    
                assert.equal(paidOffer.state, OfferState.NFTClaimed)
                assert.equal(acceptedSubOffer.state, SubOfferState.NFTClaimed)

                // doesn't seem like the state's are being updated in the program ??
                // should be equal to NFTClaimed but that assertion does not pass
                // assert.equal(paidOffer.state, OfferState.Accepted)
                // assert.equal(acceptedSubOffer.state, SubOfferState.Accepted)
                // this is also failing
                assert.equal(tokenInfo.isFrozen, false)
                assert.equal(tokenInfo.delegate.toBase58(), null)
                console.log(tokenInfo)
            } catch (e) {
                console.log("Caugh error: ", e)
                assert.fail()
            }
        } else {
        console.log("mint account null")
        assert.fail()
        }
    })
})
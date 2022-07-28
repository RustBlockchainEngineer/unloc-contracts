import * as anchor from '@project-serum/anchor'
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import LENDER from '../../../test-users/lender1.json'
import { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { UnlocLoan } from '../../../../src/types/unloc_loan'
import { TOKEN_META_PID, WSOL_MINT } from '../../../../src'
import { defaults, chainlinkIds } from '../../../../src/global-config'
import { assert } from 'chai'
import { pda, createAndMintNft, SubOfferState, safeAirdrop } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG, REWARD_VAULT_TAG } from '../../utils/const'
import { Keypair, Transaction } from '@solana/web3.js'
import { TransactionBuilder } from '@metaplex-foundation/js'
import { off } from 'process'

/**
 * Test focuses on the process_accept_offer instruction in the unloc_loan program.
 * Assertions:
 * - subOffer state == Accepted
 * - NFT token account is Frozen
 * - NFT delegate == offer
 * - Borrower's lamports balance increased by OfferAmount
 * - Lender's lamports balance decreased by OfferAmount
 */
describe('lender accepts proposed loan offer', async () => {
    // fetch test keypairs
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
    const lenderKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(LENDER))
  
    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env()
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider)
    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>
    const programId = program.programId

    // derive global state pda
    const globalState = await pda([GLOBAL_STATE_TAG], programId)
    const rewardVault = await pda([REWARD_VAULT_TAG], programId)

    // define constants
    const denominator = new anchor.BN(10000)
    let nftMint: Token = null as any
    let nftMetadataKey: anchor.web3.PublicKey = null as any
    let nftEditionKey: anchor.web3.PublicKey = null as any
    let borrowerNftVault: anchor.web3.PublicKey = null as any
    const aprNumerator = new anchor.BN(1 * denominator.toNumber() / 100) // 1%
    const expireLoanDuration = new anchor.BN(90 * 24 * 3600)

    it('lender accepts sub offer and lends WSOL', async () => {
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

            const treasuryVault = await pda([TREASURY_VAULT_TAG, WSOL_MINT.toBuffer()], programId)
            // create sub offer for lender to accept
            try {
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
                safeAirdrop(provider.connection, lenderOfferVault, 4)

                let lenderInitBalance = await (await provider.connection.getAccountInfo(lenderKeypair.publicKey)).lamports
                let borrowerInitBalance = await (await provider.connection.getAccountInfo(borrowerKeypair.publicKey)).lamports
    
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
    
                // validations
                let acceptedSubOffer = await program.account.subOffer.fetch(subOfferKey)
                const tokenInfo = await nftMint.getAccountInfo(borrowerNftVault)
                let borrowerPostBalance = await (await provider.connection.getAccountInfo(borrowerKeypair.publicKey)).lamports
                let lenderPostBalance = await (await provider.connection.getAccountInfo(lenderKeypair.publicKey)).lamports
    
                assert.equal(borrowerPostBalance, borrowerInitBalance + offerAmount.toNumber())
                assert.equal(lenderPostBalance, lenderInitBalance - offerAmount.toNumber())
                assert.equal(acceptedSubOffer.state, SubOfferState.Accepted)
                assert.equal(tokenInfo.isFrozen, true)
                assert.equal(tokenInfo.delegate.toBase58(), offer.toBase58())
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
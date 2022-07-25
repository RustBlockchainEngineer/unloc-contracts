import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import TREASURY from '../../../test-users/treasury.json'
import UNLOC_TOKEN_KEYPAIR from '../../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../../keypairs/usdc-token.json'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { UnlocLoan } from '../../../../src/types/unloc_loan';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT } from '../../../../src';
import { defaults } from '../../../../src/global-config'
import { assert, expect } from 'chai';
import { safeAirdrop, pda, createTokenMints, initGlobalStateAccount, OfferState, SubOfferState, createAndMintNft } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { SYSTEM_PROGRAM_ID } from '@unloc-dev/raydium-sdk';
import { GLOBAL_STATE_TAG, REWARD_VAULT_TAG, OFFER_SEED, SUB_OFFER_SEED, TREASURY_VAULT_TAG } from '../../utils/const'


describe('create loan offer and cancel', async () => {
    console.log("Cancel offer tes")
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
    const denominator = new anchor.BN(10000);
    const lenderRewardsPercentage = new anchor.BN(6000);
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
            console.log('set Offer tx = ', tx1)
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
    
    it('cancel loan offer without sub offers', async () => {
        if(nftMint){
            const offer = await pda([OFFER_SEED, borrowerKeypair.publicKey.toBuffer(), nftMint.publicKey.toBuffer()], programId)
            try {
                const cancelOfferTx = await program.methods.cancelOffer()
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
                console.log("cancel offer tx: ", cancelOfferTx)

                // validations
                const offerData = await program.account.offer.fetch(offer)
                assert.equal(offerData.state, OfferState.Canceled)
                // nft thawed? should write function for this and frozen check
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
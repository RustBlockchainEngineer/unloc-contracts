import * as anchor from '@project-serum/anchor';
import PROPOSER1_WALLET from '../test-users/borrower1.json'
import SUPER_OWNER_WALLET from '../test-users/super_owner.json'
import { Keypair } from '@solana/web3.js'
import { SystemProgram, Transaction, TransactionInstruction, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Collection, CreateMasterEditionV3, CreateMetadataV2, DataV2, Edition, Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { mintAndCreateMetadata, mintAndCreateMetadataV2 } from '@metaplex-foundation/mpl-token-metadata/dist/test/actions';
import { UnlocLoan } from '../../src/types/unloc_loan';
import { STAKING_PID, TOKEN_META_PID, UNLOC_MINT, USDC_MINT, VOTING_PID, getVotingKeyFromNum, systemProgram, OfferState } from '../../src';
import { setLoanGlobalState } from '../../src';
import { defaults } from '../../src/global-config'
import { assert, expect } from 'chai';
import { safeAirdrop, pda } from './utils'
import { SYSTEM_PROGRAM_ID } from '@unloc-dev/raydium-sdk';


describe('create loan offer', async ()=> {
    const OFFER_SEED = Buffer.from("OFFER_SEED");
    const SUB_OFFER_SEED = Buffer.from("SUB_OFFER_SEED");

    // fetch keypairs
    const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))
    const borrower = borrowerKeypair.publicKey;
    const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
    const superOwner = superOwnerKeypair.publicKey;

    // Configure the client to use the local cluster.
    const envProvider = anchor.AnchorProvider.env();
    const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
    anchor.setProvider(provider);
    await safeAirdrop(provider.connection, borrower, 10)

    const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
    const programId = program.programId

    let nftMint: Token = null as any;
    let nftMetadataKey: anchor.web3.PublicKey = null as any;
    let nftEditionKey: anchor.web3.PublicKey = null as any;
    let borrowerNftVault: anchor.web3.PublicKey = null as any;
    const collectionKey = Keypair.generate().publicKey

    it('create NFT', async () => {
        let nft = Token.createMint(
            provider.connection,
            superOwnerKeypair,
            superOwner,
            superOwner,
            0,
            TOKEN_PROGRAM_ID
        )
        console.log("nft: ", nft)

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
        nftEditionKey = await Edition.getPDA(nftMint.publicKey)
        const createEditionTx = new CreateMasterEditionV3({ feePayer: superOwner }, {
            edition: nftEditionKey,
            metadata: nftMetadataKey,
            mint: nftMint.publicKey,
            updateAuthority: superOwner,
            mintAuthority: superOwner,
            maxSupply: 0
        })

        try {
            const tx2 = await (program.provider as anchor.AnchorProvider).sendAndConfirm(createEditionTx, [superOwnerKeypair])
            console.log('creating nft edition tx = ', tx2)
        }
        catch (e) {
            console.log(e);
        }
    })

    it('create loan offer with nft', async () => {

        const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
        const signers = [borrowerKeypair]

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
        //assert.equal(offerData.state, OfferState.Proposed)

        // need to check status of nft (frozen, delegated, etc...)

    })

    it('cancel loan offer', async () => {

        const offer = await pda([OFFER_SEED, borrower.toBuffer(), nftMint.publicKey.toBuffer()], programId)
        try {
            const tx2 = program.methods.cancelOffer()
            .accounts({
                borrower: borrower,
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
            console.log("cancel offer tx = ", tx2)
        } catch (e) {
            console.log(e)
        }

        // need to check status of nft again (undelegated, etc...)
    })
})
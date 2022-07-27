import * as anchor from '@project-serum/anchor';
import SUPER_OWNER_WALLET from '../../../test-users/super_owner.json'
import { Token } from '@solana/spl-token';
import { UnlocLoan } from '../../../../src/types/unloc_loan';
import { TOKEN_META_PID } from '../../../../src';
import { defaults } from '../../../../src/global-config'
import { assert } from 'chai';
import { pda, OfferState, createAndMintNft } from '../../utils/loan-utils'
import PROPOSER1_WALLET from '../../../test-users/borrower1.json'
import { GLOBAL_STATE_TAG, OFFER_SEED } from '../../utils/const'
import { checkWalletATA } from '../../../../src'

/**
 * Test focuses creating an initial loan offer and sub offer by targeting the process_set_offer and process_set_sub_offer instructions
 * in the unloc_loan program. 
 * Assertions:
 * - loan offer borrower == borrower pubkey
 * - loan offer nft mint == nft mint pubkey
 * - loan offer sub offer count initialized to 0
 * - loan offer state initalized to 'Proposed'
 * - loan offer subOfferNum == 0
 * - NFT account is 'Frozen'
 * - NFT delegate == Offer account
 */

describe('create loan and sub offer', async () => {
  // fetch test keypairs
  const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
  const borrowerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(PROPOSER1_WALLET))

  
  // Configure the client to use the local cluster.
  const envProvider = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
  anchor.setProvider(provider);
  const program = anchor.workspace.UnlocLoan as anchor.Program<UnlocLoan>;
  const programId = program.programId

  // derive global state account
  const globalState = await pda([GLOBAL_STATE_TAG], programId)

  // define constants
  let nftMint: Token = null as any
  let nftMetadataKey: anchor.web3.PublicKey = null as any
  let nftEditionKey: anchor.web3.PublicKey = null as any
  let borrowerNftVault: anchor.web3.PublicKey = null as any

  it('create loan offer with NFT', async () => {
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
      // validations on offer information
      const offerData = await program.account.offer.fetch(offer)
      const tokenInfo = await nftMint.getAccountInfo(borrowerNftVault)

      assert.equal(tokenInfo.isFrozen, true)
      assert.equal(tokenInfo.delegate.toBase58(), offer.toBase58())
      assert.equal(offerData.borrower.toBase58(), borrowerKeypair.publicKey.toBase58())
      assert.equal(offerData.nftMint.toBase58(), nftMint.publicKey.toBase58())
      assert.equal(offerData.subOfferCount, 0)
      assert.equal(offerData.startSubOfferNum, 0)
      assert.equal(offerData.state, OfferState.Proposed)
    }
  })
})
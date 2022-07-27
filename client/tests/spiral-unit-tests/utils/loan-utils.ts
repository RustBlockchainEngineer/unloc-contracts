
import * as anchor from '@project-serum/anchor';
import { MintLayout, Token, TOKEN_PROGRAM_ID, AccountLayout, NATIVE_MINT } from '@solana/spl-token';
import { SystemProgram, Transaction, TransactionInstruction, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IDL as idl, UnlocLoan } from '../../../src/types/unloc_loan'
import SUPER_OWNER_WALLET from '../../test-users/super_owner.json'
import UNLOC_TOKEN_KEYPAIR from '../../keypairs/unloc-token.json'
import USDC_TOKEN_KEYPAIR from '../../keypairs/usdc-token.json'
import TREASURY from '../../test-users/treasury.json'
import { defaults, chainlinkIds } from '../../../src/global-config'
import { Collection, CreateMasterEditionV3, CreateMetadataV2, DataV2, Edition, Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TREASURY_VAULT_TAG, GLOBAL_STATE_TAG } from './const'
import { mintTokensBuilder, token } from '@metaplex-foundation/js';

const superOwnerKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(SUPER_OWNER_WALLET))
const superOwner = superOwnerKeypair.publicKey
const unlocTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(UNLOC_TOKEN_KEYPAIR))
const usdcTokenKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(USDC_TOKEN_KEYPAIR))
const treasuryKeypair = anchor.web3.Keypair.fromSecretKey(Buffer.from(TREASURY))
const treasury = treasuryKeypair.publicKey;
const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')


export let program: anchor.Program<UnlocLoan> = null as unknown as anchor.Program<UnlocLoan>
export let programProvider: anchor.AnchorProvider = null as unknown as anchor.AnchorProvider
export let programId: anchor.web3.PublicKey = null as unknown as anchor.web3.PublicKey

// Configure the client to use the local cluster.
const envProvider = anchor.AnchorProvider.env();
const provider = new anchor.AnchorProvider(envProvider.connection, new anchor.Wallet(superOwnerKeypair), envProvider.opts)
anchor.setProvider(provider);

export async function airdropSol(connection: anchor.web3.Connection, key: anchor.web3.PublicKey) {
    await connection.confirmTransaction(await connection.requestAirdrop(key, LAMPORTS_PER_SOL), "confirmed")
  }
  
  export async function pda(seeds: (Buffer | Uint8Array)[], programId: anchor.web3.PublicKey) {
    const [pdaKey] =
      await anchor.web3.PublicKey.findProgramAddress(
        seeds,
        programId,
      );
    return pdaKey
  }

  export async function createTokenMints(superOwner: anchor.web3.Keypair, unlocKeypair: anchor.web3.Keypair, usdcKeypair: anchor.web3.Keypair) {
    // if we only run this once per test suite, won't have to fetch account info which will save on time and compute
    const usdcMint = await provider.connection.getAccountInfo(usdcKeypair.publicKey)
    const unlocMint = await provider.connection.getAccountInfo(unlocKeypair.publicKey)
    let accountRentExempt = await provider.connection.getMinimumBalanceForRentExemption(MintLayout.span)
    
    // if Unloc and USDC mint have not been created yet, initialize the mints
    if (unlocMint == null || usdcMint == null){
      const createMintTx = new Transaction()
      createMintTx.add(
        SystemProgram.createAccount({
          fromPubkey: superOwner.publicKey,
          newAccountPubkey: unlocKeypair.publicKey,
          lamports: accountRentExempt,
          space: MintLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })
      )
      createMintTx.add(
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          unlocKeypair.publicKey,
          6,
          superOwner.publicKey,
          superOwner.publicKey
        )
      )
      createMintTx.add(
        SystemProgram.createAccount({
            fromPubkey: superOwner.publicKey,
            newAccountPubkey: usdcKeypair.publicKey,
            lamports: accountRentExempt,
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
        })
      )
      createMintTx.add(
          Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              usdcKeypair.publicKey,
              6,
              superOwner.publicKey,
              superOwner.publicKey
          )
      )
      await provider.sendAndConfirm(createMintTx, [superOwner, unlocKeypair, usdcKeypair], {})
    }
  }

  export async function initGlobalStateAccount(globalStateKey: anchor.web3.PublicKey, programId: anchor.web3.PublicKey, accruedInterestNumerator: number, denominator: number,
    minRepaidNumerator: number, aprNumerator: number, expireLoanDuration: number, rewardRate: number, lenderRewardsPercentage: number){
    
      let globalStateAcct = await provider.connection.getAccountInfo(globalStateKey)
      console.log("Global state key: ", globalStateKey)
      console.log("Global state Accoutn Info: ", globalStateAcct)

      if(globalStateAcct == null ){
        const rewardVault = await pda([REWARD_VAULT_TAG], programId)

        const signers = [superOwnerKeypair]
        try {
          const tx = await program.methods.setGlobalState(accruedInterestNumerator, denominator, minRepaidNumerator, aprNumerator, expireLoanDuration, rewardRate, lenderRewardsPercentage)
          .accounts({
            superOwner: superOwner,
            payer: superOwner,
            globalState: globalStateKey,
            rewardMint: unlocTokenKeypair.publicKey,
            rewardVault: rewardVault,
            newSuperOwner: superOwner,
            treasuryWallet: treasury,
            ...defaults
          })
          .signers(signers)
          .rpc()

          console.log("Set loan global state tx: ", tx)
        } catch (e) {
          console.log("Error: ", e)
        }
  }
}

export async function createAndMintNft(borrower: anchor.web3.PublicKey): Promise<nft> {
  const nftMint = await Token.createMint(
    provider.connection,
    superOwnerKeypair,
    superOwner,
    superOwner,
    0,
    TOKEN_PROGRAM_ID
  )
  const collectionKey = Keypair.generate().publicKey
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
  const nftMetadataKey = await Metadata.getPDA(nftMint.publicKey)
  const createMetadataTx = new CreateMetadataV2({ feePayer: superOwner }, {
    metadata: nftMetadataKey,
    metadataData: dataV2,
    updateAuthority: superOwner,
    mint: nftMint.publicKey,
    mintAuthority: superOwner
  })
  const tx = await provider.sendAndConfirm(createMetadataTx, [superOwnerKeypair])
  //console.log('creating nft meta tx = ', tx)

  const borrowerNftVault = await nftMint.createAccount(borrower);
  
  await nftMint.mintTo(
    borrowerNftVault,
    superOwner,
    [],
    1
  );

  // Create master edition after nft mint
  const nftEditionKey = await Edition.getPDA(nftMint.publicKey)
  const createEditionTx = new CreateMasterEditionV3({ feePayer: superOwner }, {
    edition: nftEditionKey,
    metadata: nftMetadataKey,
    mint: nftMint.publicKey,
    updateAuthority: superOwner,
    mintAuthority: superOwner,
    maxSupply: 0
  })


  const tx2 = await provider.sendAndConfirm(createEditionTx, [superOwnerKeypair])
  //console.log('creating nft edition tx = ', tx2)

  return {
    nft: nftMint,
    metadata: nftMetadataKey,
    editionKey: nftEditionKey,
    borrowerNftVault: borrowerNftVault
  }
}

export async function findAssociatedTokenAddress(
  walletAddress: anchor.web3.PublicKey,
  tokenMintAddress: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> {
  return (await anchor.web3.PublicKey.findProgramAddress(
      [
          walletAddress.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintAddress.toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  ))[0]
}

export async function createATA(user: anchor.web3.PublicKey, mint: anchor.web3.PublicKey) {
  const lamports = await Token.getMinBalanceRentForExemptAccount(provider.connection)
  const userAta = await findAssociatedTokenAddress(user, mint)
  let instructions: TransactionInstruction[] = []
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: user,
      newAccountPubkey: userAta,
      lamports: lamports,
      space: AccountLayout,
      programId: TOKEN_PROGRAM_ID
    })
  )
  instructions.push(
    Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, userAta, user)
  )

  return instructions
}

export async function mintTokens(wallet: anchor.web3.Keypair, mint: anchor.web3.PublicKey, amt: number){
  let walletAta = await findAssociatedTokenAddress(wallet.publicKey, mint)
  let associatedAcct = await provider.connection.getAccountInfo(walletAta)
  console.log("minting tokens")
  let tx = new Transaction()
  if(!associatedAcct) {
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: walletAta,
        lamports: await Token.getMinBalanceRentForExemptAccount(provider.connection),
        space: AccountLayout,
        programId: TOKEN_PROGRAM_ID
      })
    )
    tx.add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        walletAta,
        wallet.publicKey
      )
    )
    tx.add(Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      walletAta,
      superOwnerKeypair.publicKey,
      [],
      amt,
    ))

    await provider.sendAndConfirm(tx, [wallet, superOwnerKeypair])
  }
  else{
    tx.add(Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      walletAta,
      usdcTokenKeypair.publicKey,
      [],
      amt,
    ))

    await provider.sendAndConfirm(tx, [wallet, usdcTokenKeypair])
  }
}

// export async function airdropWSOL(wallet: anchor.web3.Keypair, amt: number){
//   const createATAIX = await createATA(
//     wallet.publicKey,
//     NATIVE_MINT
//   )
//   let tx = new Transaction()
//   tx.add(createATAIX[0])
//   console.log("creating wsol ata...")
//   await provider.sendAndConfirm(tx, [wallet])

//   const ata = await findAssociatedTokenAddress(wallet.publicKey, NATIVE_MINT)
//   await safeAirdrop(provider.connection, ata, amt)
//   const solTransferTransaction = new Transaction()
//   .add(
//     SystemProgram.transfer({
//         fromPubkey: wallet.publicKey,
//         toPubkey: ata,
//         lamports: amt*LAMPORTS_PER_SOL
//       }),
//       createSyncNativeInstruction(
//         associatedTokenAccount
//     )
//   )
// }

export const acceptLoanOffer = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = programProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const lender = signer
  const subOfferData = await program.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const offerMint = subOfferData.offerMint
  const offerData = await program.account.offer.fetch(subOfferData.offer)
  const borrower = offerData.borrower
  //let borrowerOfferVault = await checkWalletATA(offerMint.toBase58(), programProvider.connection, borrower)
  //let lenderOfferVault = await checkWalletATA(offerMint.toBase58(), programProvider.connection, lender)
  const treasuryVault = await pda([TREASURY_VAULT_TAG, offerMint.toBuffer()], programId)
  let lenderOfferVault = treasuryVault
  let borrowerOfferVault = treasuryVault
  

  const globalState = await pda([GLOBAL_STATE_TAG], programId)
  const rewardVault = await pda([REWARD_VAULT_TAG], programId)
  try {
    const tx = await program.methods.acceptOffer()
      .accounts({
        lender,
        borrower,
        globalState,
        offer,
        subOffer,
        offerMint,
        borrowerOfferVault,
        lenderOfferVault,
        rewardVault,
        ...chainlinkIds,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('acceptOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}

export enum OfferState {
  Proposed,
  Accepted,
  Expired,
  Fulfilled,
  NFTClaimed,
  Canceled
}
export enum SubOfferState {
  Proposed,
  Accepted,
  Expired,
  Fulfilled,
  LoanPaymentClaimed,
  Canceled,
  NFTClaimed
}

type nft = {
  nft: Token,
  metadata: anchor.web3.PublicKey,
  editionKey: anchor.web3.PublicKey,
  borrowerNftVault: anchor.web3.PublicKey
} 
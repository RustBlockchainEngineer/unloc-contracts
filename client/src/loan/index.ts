import * as anchor from '@project-serum/anchor'
import { bool, publicKey, struct, u32, u64, u8 } from '@project-serum/borsh'
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { IDL as idl, UnlocLoan } from '../types/unloc_loan'
import { chainlinkIds, defaults, discriminatorLen, NFT_LOAN_PID, STAKING_PID, TOKEN_META_PID, UNLOC_MINT, VOTING_PID } from '../global-config'
import {
  Connection,
  Keypair,
  MemcmpFilter,
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { Edition, MasterEdition, Metadata, MetadataData, MetadataKey } from '@metaplex-foundation/mpl-token-metadata'
import axios from 'axios'
import { ArweaveMetadata, IMasterEdition, IMetadata, OnChainMetadata } from './IOfferData'
import { VOTING_ITEM_TAG } from './../voting'
import { pda, SOLANA_CONNECTION } from './../utils'
import { getStakingStateAddress, getStakingExtraRewardAddress, getStakingState } from './../staking'
import { poolVault } from './../../tests/2-staking-common.spec'
import { UnlocStaking } from '../types/unloc_staking'

export let loanProgram: anchor.Program<UnlocLoan> = null as unknown as anchor.Program<UnlocLoan>
let stakingProgram = anchor.workspace.UnlocStaking as anchor.Program<UnlocStaking>
export let loanProvider: anchor.AnchorProvider = null as unknown as anchor.AnchorProvider
export let loanProgramId: anchor.web3.PublicKey = null as unknown as anchor.web3.PublicKey

const GLOBAL_STATE_TAG = Buffer.from('GLOBAL_STATE_SEED')
const OFFER_TAG = Buffer.from('OFFER_SEED')
const SUB_OFFER_TAG = Buffer.from('SUB_OFFER_SEED')
const NFT_VAULT_TAG = Buffer.from('NFT_VAULT_SEED')
const OFFER_VAULT_TAG = Buffer.from('OFFER_VAULT_SEED')
const TREASURY_VAULT_TAG = Buffer.from('TREASURY_VAULT_SEED')
const REWARD_VAULT_TAG = Buffer.from('REWARD_VAULT_SEED')
const USER_REWARD_TAG = Buffer.from('LENDER_REWARD_SEED')

const utf8 = anchor.utils.bytes.utf8;

const WSOL_MINT = new anchor.web3.PublicKey('So11111111111111111111111111111111111111112')
// This command makes an Lottery
export const initLoanProgram = (
  wallet: any,
  connection: anchor.web3.Connection = SOLANA_CONNECTION,
  pid: anchor.web3.PublicKey = NFT_LOAN_PID
) => {
  loanProgramId = pid
  const provider = new anchor.AnchorProvider(connection, wallet, { skipPreflight: true })
  loanProvider = provider;

  // Generate the loanProgram client from IDL.
  loanProgram = new (anchor as any).Program(idl, loanProgramId, provider) as anchor.Program<UnlocLoan>
}
// initLoanProgram(SOLANA_CONNECTION, Keypair.generate())

export const getLoanGlobalState = async () => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  return await loanProgram.account.globalState.fetchNullable(globalState)
}

export const getCurrentVotingKey = async () => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  return globalStateData?.voting;
};


export const getLoanOfferList = async () => {
  return await loanProgram.account.offer.all()
}

export const getLoanOfferMultiple = async (keys: anchor.web3.PublicKey[]) => {
  return await loanProgram.account.offer.fetchMultiple(keys)
}

export const getLoanOffer = async (key: anchor.web3.PublicKey) => {
  return await loanProgram.account.offer.fetchNullable(key)
}

export const getLoanOffersBy = async (
  owner?: anchor.web3.PublicKey,
  nftMint?: anchor.web3.PublicKey,
  state?: OfferState
) => {
  const filters: any[] = []
  if (owner) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen,
        bytes: owner.toBase58()
      }
    }
    filters.push(filter)
  }
  if (nftMint) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen + 32,
        bytes: nftMint.toBase58()
      }
    }
    filters.push(filter)
  }
  if (state) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen + 96,
        bytes: bs58.encode([state])
      }
    }
    filters.push(filter)
  }

  return await loanProgram.account.offer.all(filters)
}

export const getLoanSubOffer = async (key: anchor.web3.PublicKey) => {
  const subOffer = await loanProgram.account.subOffer.fetchNullable(key)
  return subOffer
}

export const getLoanSubOfferList = async (
  offer?: anchor.web3.PublicKey,
  nftMint?: anchor.web3.PublicKey,
  state?: SubOfferState
) => {
  const accountName = 'subOffer'

  const filters: any[] = []
  if (offer) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen + 97,
        bytes: offer.toBase58()
      }
    }
    filters.push(filter)
  }
  if (nftMint) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen + 32,
        bytes: nftMint.toBase58()
      }
    }
    filters.push(filter)
  }
  if (state) {
    const filter: MemcmpFilter = {
      memcmp: {
        offset: discriminatorLen + 96,
        bytes: bs58.encode([state])
      }
    }
    filters.push(filter)
  }

  const subOffers = await loanProgram.account.subOffer.all(filters)
  const result: any[] = []
  for (let i = 0; i < subOffers.length; i++) {
    result.push(subOffers[i])
  }
  return result
}

export const getAllLoanSubOffers = async () => {
  const subOffers = await loanProgram.account.subOffer.all()
  const result: any[] = []
  for (let i = 0; i < subOffers.length; i++) {
    result.push(subOffers[i])
  }
  return result
}

export const getLoanSubOfferMultiple = async (keys: anchor.web3.PublicKey[], offerState?: number) => {
  const subOffers: any[] = await loanProgram.account.subOffer.fetchMultiple(keys)

  // Filter for nulls and get the offer address
  const offerAddresses = subOffers.filter((subOffer) => subOffer).map((subOffer) => subOffer.offer)

  // Get all offer data in a single call instead of a loop, filter for nulls
  const offers: any[] = (await loanProgram.account.offer.fetchMultiple(offerAddresses)).filter((data) => data)

  const result: any[] = []
  for (let i = 0; i < subOffers.length; i++) {
    if (subOffers[i]) {
      const offerKey = subOffers[i].offer
      const offerKeyIndex = offerAddresses.findIndex((address) => address.equals(offerKey))
      const offerData = offers[offerKeyIndex]

      // If we want to, check the offer state too.
      // Suboffer can be proposed when the offer isn't, so that's why we check the state on the offer, not just the suboffer.
      // Be careful, offerState = 0 can coerce to false.
      if (typeof offerState === 'number') {
        if (offerData.startSubOfferNum.toNumber() <= subOffers[i].subOfferNumber.toNumber() && offerData.state === offerState) {
          result.push({ ...subOffers[i], subOfferKey: keys[i] })
        }
      } else {
        if (offerData.startSubOfferNum.toNumber() <= subOffers[i].subOfferNumber.toNumber()) {
          result.push({ ...subOffers[i], subOfferKey: keys[i] })
        }
      }
    }
  }
  return result
}

export const setLoanGlobalState = async (
  accruedInterestNumerator: anchor.BN,
  denominator: anchor.BN,
  minRepaidNumerator: anchor.BN,
  aprNumerator: anchor.BN,
  expireLoanDuration: anchor.BN,
  rewardRate: anchor.BN,
  lenderRewardsPercentage: anchor.BN,
  rewardMint: anchor.web3.PublicKey,
  treasury: anchor.web3.PublicKey,
  newSuperOwner: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const superOwner = signer

  try {

    const tx = await loanProgram.methods.setGlobalState(
      accruedInterestNumerator, 
      denominator, 
      minRepaidNumerator, 
      aprNumerator, 
      expireLoanDuration, 
      rewardRate, 
      lenderRewardsPercentage,
      newSuperOwner,
      treasury,
      )
      .accounts({
        superOwner,
        globalState,
        rewardMint,
        rewardVault,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('setGlobalState tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}

export const setLoanStakingPool = async (
  unlocStakingPoolId: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const superOwner = signer

  try {
    const tx = await loanProgram.methods.setStakingPool(
      unlocStakingPoolId
      )
      .accounts({
        superOwner,
        globalState,
      })
      .signers(signers)
      .rpc()
    console.log('tx = ', tx)
  } catch (e) {
    console.log(e);
  }
}

export const setLoanVoting = async (
  votingId: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const superOwner = signer
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  try {
    const tx = await loanProgram.methods.setVoting(votingId)
      .accounts({
        superOwner,
        globalState,
        rewardVault,
        ...chainlinkIds,
        ...defaults
      })
      .signers(signers)
      .rpc()
    console.log('tx = ', tx)
  } catch (e) {
    console.log(e);
  }
}
export const depositRewards = async (
  amount: anchor.BN,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const rewardMint = UNLOC_MINT
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const authority = signer
  const userRewardVault = await checkWalletATA(rewardMint.toBase58(), loanProvider.connection, authority)

  const tx = await loanProgram.methods.depositRewards(amount)
    .accounts({
      globalState,
      authority,
      rewardVault,
      userRewardVault,
      ...chainlinkIds,
      ...defaults
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log('deposit rewards tx = ', tx)
}
export const withdrawRewards = async (
  amount: anchor.BN,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const rewardMint = UNLOC_MINT
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const authority = signer
  const userRewardVault = await checkWalletATA(rewardMint.toBase58(), loanProvider.connection, authority)
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const tx = await loanProgram.methods.withdrawRewards(amount)
    .accounts({
      globalState,
      authority,
      rewardVault,
      userRewardVault,
      ...chainlinkIds,
      ...defaults
    })
    .signers(signers)
    .rpc()

  // eslint-disable-next-line no-console
  console.log('withdraw rewards tx = ', tx)
}
// super owner can call this function
export const claimExpiredCollateral = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  const treasuryWallet = globalStateData.treasuryWallet
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const offerData = await loanProgram.account.offer.fetch(offer)
  const nftMint = offerData.nftMint

  let userNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, signer)
  const preInstructions: TransactionInstruction[] = []

  if (!userNftVault) {
    userNftVault = await addTokenAccountInstruction(nftMint, signer, preInstructions, signer, signers)
  }

  let borrowerNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, offerData.borrower)
  const edition = await Edition.getPDA(nftMint);
  try {
    const tx = await loanProgram.methods.claimExpiredCollateral()
      .accounts({
        superOwner: signer,
        globalState,
        treasuryWallet,
        offer,
        subOffer,
        nftMint,
        edition,
        userNftVault,
        borrowerNftVault,
        metadataProgram: TOKEN_META_PID,
        ...defaults
      })
      .preInstructions(preInstructions)
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('claimExpiredCollateral tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}


export const claimLenderRewards = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  newKeypair: anchor.web3.Keypair,
  signers: anchor.web3.Keypair[] = []
) => {
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const rewardMint = UNLOC_MINT
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const authority = signer
  //let lenderRewardVault = await checkWalletATA(rewardMint.toBase58(), loanProvider.connection, subOfferData.lender)
  const preInstructions: TransactionInstruction[] = []
  const stakeSeed = 21
  //if (!lenderRewardVault) {
  let lenderRewardVault = await addTokenAccountFromKeypairInstruction(rewardMint, subOfferData.lender, newKeypair, preInstructions, signer, signers)
  //}

  const [poolSigner, poolBump] = await anchor.web3.PublicKey.findProgramAddress(
    [rewardMint.toBuffer()],
    STAKING_PID
  )

  const [userState, bump2] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), authority.toBuffer()], STAKING_PID)

  const [userAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), authority.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], STAKING_PID)

  const stateSigner = await getStakingStateAddress()
  const extraRewardSigner = await getStakingExtraRewardAddress()
  const state = await getStakingState()

  try {
    const lenderTx = await loanProgram.methods.claimLenderRewards()
      .accounts({
        authority,
        globalState,
        rewardVault,
        subOffer,
        ...chainlinkIds,
        lenderRewardVault,
        userState: userState,
        stakeUser: userAccount,
        stakeState: stateSigner,
        stakePool: poolSigner,
        extraRewardAccount: extraRewardSigner,
        stakeMint: rewardMint,
        stakePoolVault: poolVault,
        feeVault: state.feeVault,
        unlocStakingProgram:STAKING_PID,
        systemProgram: SystemProgram.programId,
        ...defaults
      })
      .preInstructions(preInstructions)
      .signers(signers)
      .rpc()

      console.log('claim lender rewards tx = ', lenderTx)
      return lenderTx
  } catch (e) {
    console.log(e)
  }
  return ''
}


export const claimBorrowerRewards = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  newKeypair: anchor.web3.Keypair,
  signers: anchor.web3.Keypair[] = []
) => {
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const rewardMint = UNLOC_MINT
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const authority = signer
  const preInstructions: TransactionInstruction[] = []
  const stakeSeed = 21
  //let borrowerRewardVault = await checkWalletATA(rewardMint.toBase58(), loanProvider.connection, subOfferData.borrower)
  //if (!borrowerRewardVault) {
  let borrowerRewardVault = await addTokenAccountFromKeypairInstruction(rewardMint, subOfferData.borrower, newKeypair, preInstructions, signer, signers)
  //}

  const [poolSigner, poolBump] = await anchor.web3.PublicKey.findProgramAddress(
    [rewardMint.toBuffer()],
    STAKING_PID
  )

  const [userState, bump2] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), authority.toBuffer()], STAKING_PID)

  const [userAccount, bump1] = await PublicKey.findProgramAddress([
    new PublicKey(poolSigner).toBuffer(), authority.toBuffer(), new anchor.BN(stakeSeed).toBuffer('le', 1)
  ], STAKING_PID)

  const stateSigner = await getStakingStateAddress()
  const extraRewardSigner = await getStakingExtraRewardAddress()
  const state = await getStakingState()

  try {
    const borrowerTx = await loanProgram.methods.claimBorrowerRewards()
      .accounts({
        authority,
        globalState,
        rewardVault,
        subOffer,
        ...chainlinkIds,
        borrowerRewardVault,
        userState: userState,
        stakeUser: userAccount,
        stakeState: stateSigner,
        stakePool: poolSigner,
        extraRewardAccount: extraRewardSigner,
        stakeMint: rewardMint,
        stakePoolVault: poolVault,
        feeVault: state.feeVault,
        unlocStakingProgram:STAKING_PID,
        systemProgram: SystemProgram.programId,

        ...defaults
      })
      .preInstructions(preInstructions)
      .signers(signers)
      .rpc()

      console.log('claim borrower rewards tx = ', borrowerTx)
      return borrowerTx
  } catch (e) {
    console.log(e)
  }

  return ''
}
// setLoanOffer -> createLoanOffer
export const createLoanOffer = async (
  nftMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const borrowerNftVault: anchor.web3.PublicKey = await checkWalletATA(
    nftMint.toBase58(),
    loanProvider.connection,
    signer
  )

  const borrower = signer
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), nftMint.toBuffer()], loanProgramId)
  const nftMetadata = await Metadata.getPDA(nftMint)
  const edition = await Edition.getPDA(nftMint);

  try {
    const tx = await loanProgram.methods.createOffer()
      .accounts({
        borrower,
        offer,
        nftMint,
        nftMetadata,
        edition,
        userVault: borrowerNftVault,
        metadataProgram: TOKEN_META_PID,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('setOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
// cancelLoanOffer -> deleteLoanOffer
export const deleteLoanOffer = async (
  nftMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const borrower = signer
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), nftMint.toBuffer()], loanProgramId)

  let borrowerNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, borrower)
  const preInstructions: TransactionInstruction[] = []
  if (!borrowerNftVault) {
    borrowerNftVault = await addTokenAccountInstruction(nftMint, borrower, preInstructions, signer, signers)
  }
  const edition = await Edition.getPDA(nftMint);
  try {
    const tx = await loanProgram.methods.deleteOffer()
      .accounts({
        borrower,
        offer,
        nftMint,
        edition,
        userVault: borrowerNftVault,
        metadataProgram: TOKEN_META_PID,
        ...defaults
      })
      .preInstructions(preInstructions)
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('deleteLoanOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const createLoanSubOffer = async (
  offerAmount: anchor.BN,
  loanDuration: anchor.BN,
  aprNumerator: anchor.BN,
  nftMint: anchor.web3.PublicKey,
  offerMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  if (offerMint.equals(NATIVE_MINT)) {
    offerMint = WSOL_MINT
  }
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const borrower = signer
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), nftMint.toBuffer()], loanProgramId)
  const offerData = await loanProgram.account.offer.fetch(offer)
  const subOfferNumer = offerData.subOfferCount
  const subOffer = await pda([SUB_OFFER_TAG, offer.toBuffer(), subOfferNumer.toArrayLike(Buffer, 'be', 8)], loanProgramId)
  try {
    const tx = await loanProgram.methods.createSubOffer(offerAmount, loanDuration, aprNumerator)
      .accounts({
        borrower,
        globalState,
        offer,
        subOffer,
        offerMint,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('createSubOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const createLoanSubOfferByStaking = async (
  offerAmount: anchor.BN,
  loanDuration: anchor.BN,
  aprNumerator: anchor.BN,
  nftMint: anchor.web3.PublicKey,
  offerMint: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  if (offerMint.equals(NATIVE_MINT)) {
    offerMint = WSOL_MINT
  }
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const borrower = signer
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), nftMint.toBuffer()], loanProgramId)
  const offerData = await loanProgram.account.offer.fetch(offer)
  const subOfferNumer = offerData.subOfferCount
  const subOffer = await pda([SUB_OFFER_TAG, offer.toBuffer(), subOfferNumer.toArrayLike(Buffer, 'be', 8)], loanProgramId)
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  //const stakeSeed = 10
  const stakingUser = await pda([globalStateData.unlocStakingPoolId.toBuffer(), borrower.toBuffer()], STAKING_PID)
  let [stateSigner, stateBump] = await anchor.web3.PublicKey.findProgramAddress(
    [utf8.encode('state')],
    STAKING_PID
  )

  try {
    const stakingStateAcct = await loanProvider.connection.getAccountInfo(stakingUser)

    if (stakingStateAcct == null) {
      const createStateAcctTx = await stakingProgram.methods.createUserState()
        .accounts({
          userState: stakingUser,
          pool: globalStateData.unlocStakingPoolId,
          authority: borrower,
          payer: borrower,
          systemProgram: SystemProgram.programId
        })
        .signers(signers)
        .rpc()
        console.log('create user state tx = ', createStateAcctTx)
    }
  } catch (e) {
    console.log(e)
  }
  try {
    const tx = await loanProgram.methods
      .createSubOffer(offerAmount, loanDuration, aprNumerator)
      .accounts({
        borrower,
        globalState,
        offer,
        subOffer,
        offerMint,
        ...defaults
      })
      .remainingAccounts([
        { pubkey: stakingUser, isSigner: false, isWritable: false },
        { pubkey: stateSigner, isSigner: false, isWritable: false }
      ])
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('createLoanSubOfferByStaking tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const updateLoanSubOffer = async (
  offerAmount: anchor.BN,
  loanDuration: anchor.BN,
  aprNumerator: anchor.BN,

  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const borrower = signer
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), subOfferData.nftMint.toBuffer()], loanProgramId)
  const offerMint = subOfferData.offerMint
  try {
    const tx = await loanProgram.methods.updateSubOffer(offerAmount, loanDuration, aprNumerator)
      .accounts({
        borrower,
        offer,
        subOffer,
        offerMint,
        ...defaults
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('updateSubOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
// cancelLoanSubOffer -> deleteLoanSubOffer
export const deleteLoanSubOffer = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const borrower = signer
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = await pda([OFFER_TAG, borrower.toBuffer(), subOfferData.nftMint.toBuffer()], loanProgramId)
  try {
    const tx = await loanProgram.methods.deleteSubOffer()
      .accounts({
        borrower,
        offer,
        subOffer
      })
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('deleteSubOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const acceptLoanOffer = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const lender = signer
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const offerMint = subOfferData.offerMint
  const offerData = await loanProgram.account.offer.fetch(subOfferData.offer)
  const borrower = offerData.borrower

  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)

  let borrowerOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, borrower)
  let lenderOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, lender)
  const preInstructions: TransactionInstruction[] = []
  const postInstructions: TransactionInstruction[] = []
  if (offerMint.equals(WSOL_MINT)) {
    const treasuryVault = await pda([TREASURY_VAULT_TAG, offerMint.toBuffer(), globalStateData.treasuryWallet.toBuffer()], loanProgramId)
    lenderOfferVault = treasuryVault
    borrowerOfferVault = treasuryVault
  } else {
    if (!borrowerOfferVault) {
      console.log("borrower doesn't have offer token account!")
      borrowerOfferVault = await addTokenAccountInstruction(offerMint, borrower, preInstructions, signer, signers)
    }
    if (!lenderOfferVault) {
      console.log("lender doesn't have offer token!")
      return
    }
  }
  
  try {
    const tx = await loanProgram.methods.acceptOffer()
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
      .preInstructions(preInstructions)
      .postInstructions(postInstructions)
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('acceptOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const acceptLoanOfferByVoting = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const lender = signer
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const offerMint = subOfferData.offerMint
  const offerData = await loanProgram.account.offer.fetch(subOfferData.offer)
  const borrower = offerData.borrower

  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)

  let borrowerOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, borrower)
  let lenderOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, lender)
  const preInstructions: TransactionInstruction[] = []
  const postInstructions: TransactionInstruction[] = []
  if (offerMint.equals(WSOL_MINT)) {
    const treasuryVault = await pda([TREASURY_VAULT_TAG, offerMint.toBuffer(), globalStateData.treasuryWallet.toBuffer()], loanProgramId)
    lenderOfferVault = treasuryVault
    borrowerOfferVault = treasuryVault
  } else {
    if (!borrowerOfferVault) {
      console.log("borrower doesn't have offer token account!")
      borrowerOfferVault = await addTokenAccountInstruction(offerMint, borrower, preInstructions, signer, signers)
    }
    if (!lenderOfferVault) {
      console.log("lender doesn't have offer token!")
      return
    }
  }
  
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const votingPid = VOTING_PID;
  const currentVotingKey = await getCurrentVotingKey();
  const votingItemKey = await pda([VOTING_ITEM_TAG, currentVotingKey.toBuffer(), offerData.collection.toBuffer()], votingPid)
  try {
    const tx = await loanProgram.methods.acceptOffer()
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
        ...defaults,
      })
      .remainingAccounts([
        { pubkey: currentVotingKey, isSigner: false, isWritable: false },
        { pubkey: votingItemKey, isSigner: false, isWritable: false }
      ])
      .preInstructions(preInstructions)
      .postInstructions(postInstructions)
      .signers(signers)
      .rpc()


    // eslint-disable-next-line no-console
    console.log('acceptOffer tx = ', tx)
  } catch (e) {
    console.log(e);
  }
}

export const repayLoan = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const borrower = signer
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  const treasuryWallet = globalStateData.treasuryWallet
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const lender = subOfferData.lender
  const offerData = await loanProgram.account.offer.fetch(offer)
  const offerMint = subOfferData.offerMint
  const nftMint = offerData.nftMint
  const treasuryVault = await pda([TREASURY_VAULT_TAG, offerMint.toBuffer(), globalStateData.treasuryWallet.toBuffer()], loanProgramId)

  const stakingUser = await pda([globalStateData.unlocStakingPoolId.toBuffer(), borrower.toBuffer()], STAKING_PID)
  try {
    const stakingStateAcct = await loanProvider.connection.getAccountInfo(stakingUser)

    if (stakingStateAcct == null) {
      console.log("Creating borrower stake account")
      const createStateAcctTx = await stakingProgram.methods.createUserState()
        .accounts({
          userState: stakingUser,
          pool: globalStateData.unlocStakingPoolId,
          authority: borrower,
          payer: borrower,
          systemProgram: SystemProgram.programId
        })
        .signers(signers)
        .rpc()
        console.log('create user state tx = ', createStateAcctTx)
    }
  } catch (e) {
    console.log(e)
  }

  let borrowerOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, borrower)
  let borrowerNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, borrower)
  let lenderOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, lender)
  const preInstructions: TransactionInstruction[] = []
  const postInstructions: TransactionInstruction[] = []
  if (offerMint.equals(WSOL_MINT)) {
    lenderOfferVault = treasuryVault
    borrowerOfferVault = treasuryVault
  }

  if (!borrowerOfferVault) {
    console.log("borrower doesn't have offer token!")
    return
  }
  if (!borrowerNftVault) {
    console.log("borrower doesn't have nft token token account!")
    borrowerNftVault = await addTokenAccountInstruction(nftMint, borrower, preInstructions, signer, signers)
  }
  if (!lenderOfferVault) {
    console.log("lender doesn't have offer token account!", lender.toBase58())
    lenderOfferVault = await addTokenAccountInstruction(offerMint, lender, preInstructions, signer, signers)
  }

  const edition = await Edition.getPDA(nftMint);
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  try {
    const tx = await loanProgram.methods.repayLoan()
      .accounts({
        borrower,
        lender,
        globalState,
        treasuryWallet,
        offer,
        subOffer,
        nftMint,
        edition,
        rewardVault,
        borrowerNftVault,
        lenderOfferVault,
        borrowerOfferVault,
        offerMint,
        treasuryVault,
        userStakeState: stakingUser,
        metadataProgram: TOKEN_META_PID,
        ...chainlinkIds,
        ...defaults
      })
      .preInstructions(preInstructions)
      .postInstructions(postInstructions)
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('repayLoan tx = ', tx)
  } catch (e) {
    console.log(e);
  }

}
export const claimLoanCollateral = async (
  subOffer: anchor.web3.PublicKey,
  signer: anchor.web3.PublicKey = loanProvider.wallet.publicKey,
  signers: anchor.web3.Keypair[] = []
) => {
  const globalState = await pda([GLOBAL_STATE_TAG], loanProgramId)
  const lender = signer
  const globalStateData = await loanProgram.account.globalState.fetch(globalState)
  const treasuryWallet = globalStateData.treasuryWallet
  const subOfferData = await loanProgram.account.subOffer.fetch(subOffer)
  const offer = subOfferData.offer
  const offerData = await loanProgram.account.offer.fetch(offer)
  const offerMint = subOfferData.offerMint
  const nftMint = offerData.nftMint
  const treasuryVault = await pda([TREASURY_VAULT_TAG, offerMint.toBuffer(), treasuryWallet.toBuffer()], loanProgramId)

  const stakingUser = await pda([globalStateData.unlocStakingPoolId.toBuffer(), lender.toBuffer()], STAKING_PID)
  try {
    const stakingStateAcct = await loanProvider.connection.getAccountInfo(stakingUser)

    if (stakingStateAcct == null) {
      console.log("Creating lender stake account")
      const createUserStateTx = await stakingProgram.methods.createUserState()
      .accounts({
        userState: stakingUser,
        pool: globalStateData.unlocStakingPoolId,
        authority: lender,
        payer: lender,
        systemProgram: SystemProgram.programId
      })
      .signers(signers)
      .rpc()

      console.log("Create lender state account tx: ", createUserStateTx)
    }
  } catch (e) {
    console.log(e)
  }

  let borrowerNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, offerData.borrower)
  let lenderNftVault = await checkWalletATA(nftMint.toBase58(), loanProvider.connection, lender)
  let lenderOfferVault = await checkWalletATA(offerMint.toBase58(), loanProvider.connection, lender)
  const preInstructions: TransactionInstruction[] = []
  const postInstructions: TransactionInstruction[] = []
  if (offerMint.equals(WSOL_MINT)) {
    lenderOfferVault = treasuryVault
  }

  if (!lenderNftVault) {
    console.log("lender doesn't have nft token token account!")
    lenderNftVault = await addTokenAccountInstruction(nftMint, lender, preInstructions, signer, signers)
  }
  if (!lenderOfferVault) {
    console.log("lender doesn't have offer token account!", lender.toBase58())
    lenderOfferVault = await addTokenAccountInstruction(offerMint, lender, preInstructions, signer, signers)
  }
  const rewardVault = await pda([REWARD_VAULT_TAG], loanProgramId)
  const edition = await Edition.getPDA(nftMint);
  try {
    const tx = await loanProgram.methods.claimCollateral()
      .accounts({
        lender,
        globalState,
        treasuryWallet,
        offer,
        subOffer,
        nftMint,
        edition,
        lenderNftVault,
        borrowerNftVault,
        lenderOfferVault,
        offerMint,
        treasuryVault,
        rewardVault,
        userStakeState: stakingUser,
        metadataProgram: TOKEN_META_PID,
        ...chainlinkIds,
        ...defaults
      })
      .preInstructions(preInstructions)
      .postInstructions(postInstructions)
      .signers(signers)
      .rpc()

    // eslint-disable-next-line no-console
    console.log('claimCollateral tx = ', tx)
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
  Canceled
}

export const getLoanSubOffersKeysByState = async (state: SubOfferState[]) => {
  try {
    const accountName = 'subOffer'
    const data = await loanProvider.connection.getProgramAccounts(loanProgramId, {
      dataSlice: { offset: 0, length: 0 }, // Fetch without any data.
      filters: [
        { memcmp: loanProgram.account.subOffer.coder.accounts.memcmp(accountName) },
        { memcmp: { offset: discriminatorLen + 96, bytes: bs58.encode(state) } } // add filters for nftMint, APR, Duration, Amount and this function will be glorious
      ]
    })
    return data.map((offer) => offer.pubkey)
  } catch (e) {
    console.log(e)
  }
}

export const addTokenAccountInstruction = async (
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  instructions: TransactionInstruction[],
  signer: anchor.web3.PublicKey,
  signers: anchor.web3.Keypair[],
  rent: number = 0
) => {
  const newKeypair = Keypair.generate()
  const rentForTokenAccount = await Token.getMinBalanceRentForExemptAccount(loanProvider.connection)
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: signer,
      newAccountPubkey: newKeypair.publicKey,
      lamports: rent > 0 ? rent : rentForTokenAccount,
      space: ACCOUNT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID
    })
  )
  const instruction = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, newKeypair.publicKey, owner)
  instructions.push(instruction)
  signers.push(newKeypair)
  return newKeypair.publicKey
}

export const addTokenAccountFromKeypairInstruction = async (
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  newKeypair: anchor.web3.Keypair,
  instructions: TransactionInstruction[],
  signer: anchor.web3.PublicKey,
  signers: anchor.web3.Keypair[],
  rent: number = 0
) => {
  //const newKeypair = Keypair.generate()
  const rentForTokenAccount = await Token.getMinBalanceRentForExemptAccount(loanProvider.connection)
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: signer,
      newAccountPubkey: newKeypair.publicKey,
      lamports: rent > 0 ? rent : rentForTokenAccount,
      space: ACCOUNT_LAYOUT.span,
      programId: TOKEN_PROGRAM_ID
    })
  )
  const instruction = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, newKeypair.publicKey, owner)
  instructions.push(instruction)
  signers.push(newKeypair)
  return newKeypair.publicKey
}

export const checkWalletATA = async (
  mint: string,
  connection: anchor.web3.Connection = loanProvider.connection,
  walletPubkey: anchor.web3.PublicKey = loanProvider.wallet.publicKey
) => {
  const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletPubkey,
    {
      programId: TOKEN_PROGRAM_ID
    },
    'confirmed'
  )
  let result: any = null
  let maxAmount = 0
  parsedTokenAccounts.value.forEach(async (tokenAccountInfo) => {
    const tokenAccountPubkey = tokenAccountInfo.pubkey
    const parsedInfo = tokenAccountInfo.account.data.parsed.info
    const mintAddress = parsedInfo.mint
    const amount = parsedInfo.tokenAmount.uiAmount
    if (mintAddress === mint && amount >= maxAmount) {
      result = tokenAccountPubkey
      maxAmount = amount
    }
  })

  return result
}

export const logObject = (title: string, obj: any) => {
  console.log(title, obj)
}
export const getOfferBalance = async (
  subOffer: anchor.web3.PublicKey,
  connection: anchor.web3.Connection = loanProvider.connection,
  walletPubkey: anchor.web3.PublicKey = loanProvider.wallet.publicKey
) => {
  try {
    const tokenAccount = await pda([OFFER_VAULT_TAG, subOffer.toBuffer()], loanProgramId)
    const balance = (await connection.getTokenAccountBalance(tokenAccount)).value.uiAmount as number
    return balance
  } catch (e) {
    console.log(e)
  }
  return 0
}
// --------------------utilities---------------------

export class MultipleNFT {
  public mints: anchor.web3.PublicKey[]
  public metadatas: NFTMetadata[] = []
  constructor(keys: anchor.web3.PublicKey[]) {
    this.mints = keys
  }
  public async initialize() {
    if (this.metadatas.length == 0) {
      const metadataPDAs: PublicKey[] = []
      for (let i = 0; i < this.mints.length; i++) {
        const metadataPDA = await Metadata.getPDA(this.mints[i])
        metadataPDAs.push(metadataPDA)
      }
      let i = 0
      const metaInfos = await Metadata.getInfos(loanProvider.connection, metadataPDAs)
      metaInfos.forEach((value: anchor.web3.AccountInfo<Buffer>, key: any, map: any) => {
        const metadata = MetadataData.deserialize(value.data)
        const nftMetadata = new NFTMetadata(this.mints[i], metadataPDAs[i], metadata)
        this.metadatas.push(nftMetadata)
        i++
      })
    }
  }
  public getNftMeta(mint: PublicKey) {
    for (let i = 0; i < this.metadatas.length; i++) {
      if (this.metadatas[i].mint === mint.toBase58()) {
        return this.metadatas[i]
      }
    }
    return null
  }
  public async initArweavedata() {
    for (let i = 0; i < this.metadatas.length; i++) {
      await this.metadatas[i].getAreaveMetadata()
    }
  }
}

export class NFTMetadata implements IMetadata {
  mint = ''
  metadataPDA = ''
  onChainMetadata: OnChainMetadata = null as any
  arweaveMetadata: ArweaveMetadata = null as any
  masterEdition: IMasterEdition = null as any
  constructor(mint: anchor.web3.PublicKey, metadataPDA: anchor.web3.PublicKey, onChainMetadata: OnChainMetadata) {
    this.mint = mint.toBase58()
    this.metadataPDA = metadataPDA.toBase58()
    this.onChainMetadata = onChainMetadata
  }

  public async getAreaveMetadata() {
    if (this.arweaveMetadata === null) {
      try {
        const arweaveData = await axios.get(this.onChainMetadata.data.uri)
        if (arweaveData) {
          this.arweaveMetadata = arweaveData.data
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    }
    return this.arweaveMetadata
  }
  public currentAreaveMetadata() {
    return this.arweaveMetadata
  }
  public async getMasterEdition() {
    if (this.arweaveMetadata === null) {
      const masterEditionPDA = await Edition.getPDA(new PublicKey(this.mint))
      const editionAccountInfo = await loanProvider.connection.getAccountInfo(masterEditionPDA)

      if (editionAccountInfo) {
        const key = editionAccountInfo?.data[0]
        let masterEditionData
        let data

        switch (key) {
          case MetadataKey.MasterEditionV1:
          case MetadataKey.MasterEditionV2:
            ; ({ data } = new MasterEdition(masterEditionPDA, editionAccountInfo))
            masterEditionData = data
            break
          default:
            masterEditionData = undefined
            break
        }

        this.masterEdition = {
          masterEditionPDA: masterEditionPDA.toString(),
          masterEditionData
        }
      }
    }
    return this.masterEdition
  }
}
export const ACCOUNT_LAYOUT = struct([
  publicKey('mint'),
  publicKey('owner'),
  u64('amount'),
  u32('delegateOption'),
  publicKey('delegate'),
  u8('state'),
  u32('isNativeOption'),
  u64('isNative'),
  u64('delegatedAmount'),
  u32('closeAuthorityOption'),
  publicKey('closeAuthority')
])

export const MINT_LAYOUT = struct([
  u32('mintAuthorityOption'),
  publicKey('mintAuthority'),
  u64('supply'),
  u8('decimals'),
  bool('initialized'),
  u32('freezeAuthorityOption'),
  publicKey('freezeAuthority')
])

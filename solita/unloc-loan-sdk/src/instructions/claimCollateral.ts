/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category ClaimCollateral
 * @category generated
 */
export const claimCollateralStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'ClaimCollateralInstructionArgs'
)
/**
 * Accounts required by the _claimCollateral_ instruction
 *
 * @property [_writable_, **signer**] lender
 * @property [] globalState
 * @property [_writable_] treasuryWallet
 * @property [_writable_] offer
 * @property [_writable_] subOffer
 * @property [] nftMint
 * @property [_writable_] lenderNftVault
 * @property [_writable_] borrowerNftVault
 * @property [_writable_] lenderOfferVault
 * @property [_writable_] treasuryVault
 * @property [] edition
 * @property [] rewardVault
 * @property [] chainlinkProgram
 * @property [] solFeed
 * @property [] usdcFeed
 * @property [] metadataProgram
 * @property [] clock
 * @category Instructions
 * @category ClaimCollateral
 * @category generated
 */
export type ClaimCollateralInstructionAccounts = {
  lender: web3.PublicKey
  globalState: web3.PublicKey
  treasuryWallet: web3.PublicKey
  offer: web3.PublicKey
  subOffer: web3.PublicKey
  nftMint: web3.PublicKey
  lenderNftVault: web3.PublicKey
  borrowerNftVault: web3.PublicKey
  lenderOfferVault: web3.PublicKey
  treasuryVault: web3.PublicKey
  edition: web3.PublicKey
  rewardVault: web3.PublicKey
  chainlinkProgram: web3.PublicKey
  solFeed: web3.PublicKey
  usdcFeed: web3.PublicKey
  metadataProgram: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  clock: web3.PublicKey
}

export const claimCollateralInstructionDiscriminator = [
  55, 78, 194, 172, 196, 18, 230, 252,
]

/**
 * Creates a _ClaimCollateral_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category ClaimCollateral
 * @category generated
 */
export function createClaimCollateralInstruction(
  accounts: ClaimCollateralInstructionAccounts,
  programId = new web3.PublicKey('6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh')
) {
  const [data] = claimCollateralStruct.serialize({
    instructionDiscriminator: claimCollateralInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.lender,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.globalState,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.treasuryWallet,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.offer,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.subOffer,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.nftMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.lenderNftVault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.borrowerNftVault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.lenderOfferVault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.treasuryVault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.edition,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.rewardVault,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.chainlinkProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.solFeed,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.usdcFeed,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.metadataProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.clock,
      isWritable: false,
      isSigner: false,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
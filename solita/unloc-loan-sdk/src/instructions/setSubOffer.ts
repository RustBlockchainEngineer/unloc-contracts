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
 * @category SetSubOffer
 * @category generated
 */
export type SetSubOfferInstructionArgs = {
  offerAmount: beet.bignum
  subOfferNumber: beet.bignum
  loanDuration: beet.bignum
  aprNumerator: beet.bignum
}
/**
 * @category Instructions
 * @category SetSubOffer
 * @category generated
 */
export const setSubOfferStruct = new beet.BeetArgsStruct<
  SetSubOfferInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['offerAmount', beet.u64],
    ['subOfferNumber', beet.u64],
    ['loanDuration', beet.u64],
    ['aprNumerator', beet.u64],
  ],
  'SetSubOfferInstructionArgs'
)
/**
 * Accounts required by the _setSubOffer_ instruction
 *
 * @property [_writable_, **signer**] borrower
 * @property [_writable_, **signer**] payer
 * @property [] globalState
 * @property [_writable_] offer
 * @property [_writable_] subOffer
 * @property [] offerMint
 * @property [_writable_] treasuryWallet
 * @property [_writable_] treasuryVault
 * @property [] clock
 * @category Instructions
 * @category SetSubOffer
 * @category generated
 */
export type SetSubOfferInstructionAccounts = {
  borrower: web3.PublicKey
  payer: web3.PublicKey
  globalState: web3.PublicKey
  offer: web3.PublicKey
  subOffer: web3.PublicKey
  offerMint: web3.PublicKey
  treasuryWallet: web3.PublicKey
  treasuryVault: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  rent?: web3.PublicKey
  clock: web3.PublicKey
}

export const setSubOfferInstructionDiscriminator = [
  82, 195, 140, 176, 94, 33, 106, 214,
]

/**
 * Creates a _SetSubOffer_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SetSubOffer
 * @category generated
 */
export function createSetSubOfferInstruction(
  accounts: SetSubOfferInstructionAccounts,
  args: SetSubOfferInstructionArgs,
  programId = new web3.PublicKey('6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh')
) {
  const [data] = setSubOfferStruct.serialize({
    instructionDiscriminator: setSubOfferInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.borrower,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.globalState,
      isWritable: false,
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
      pubkey: accounts.offerMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.treasuryWallet,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.treasuryVault,
      isWritable: true,
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
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
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

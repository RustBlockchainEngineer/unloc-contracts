/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'

/**
 * @category Instructions
 * @category SetVotingItem
 * @category generated
 */
export type SetVotingItemInstructionArgs = {
  key: web3.PublicKey
}
/**
 * @category Instructions
 * @category SetVotingItem
 * @category generated
 */
export const setVotingItemStruct = new beet.BeetArgsStruct<
  SetVotingItemInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['key', beetSolana.publicKey],
  ],
  'SetVotingItemInstructionArgs'
)
/**
 * Accounts required by the _setVotingItem_ instruction
 *
 * @property [_writable_, **signer**] superOwner
 * @property [_writable_, **signer**] payer
 * @property [_writable_] globalState
 * @property [_writable_] voting
 * @property [_writable_] votingItem
 * @category Instructions
 * @category SetVotingItem
 * @category generated
 */
export type SetVotingItemInstructionAccounts = {
  superOwner: web3.PublicKey
  payer: web3.PublicKey
  globalState: web3.PublicKey
  voting: web3.PublicKey
  votingItem: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  rent?: web3.PublicKey
}

export const setVotingItemInstructionDiscriminator = [
  111, 119, 235, 168, 128, 40, 117, 99,
]

/**
 * Creates a _SetVotingItem_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SetVotingItem
 * @category generated
 */
export function createSetVotingItemInstruction(
  accounts: SetVotingItemInstructionAccounts,
  args: SetVotingItemInstructionArgs,
  programId = new web3.PublicKey('6z6RuFauTG511XRakJnPhxUTCVPohv6oC69xieMdm4Z9')
) {
  const [data] = setVotingItemStruct.serialize({
    instructionDiscriminator: setVotingItemInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.superOwner,
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
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.voting,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.votingItem,
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
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}

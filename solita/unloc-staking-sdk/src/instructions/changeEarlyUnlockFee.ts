/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category ChangeEarlyUnlockFee
 * @category generated
 */
export type ChangeEarlyUnlockFeeInstructionArgs = {
  earlyUnlockFee: beet.bignum
}
/**
 * @category Instructions
 * @category ChangeEarlyUnlockFee
 * @category generated
 */
export const changeEarlyUnlockFeeStruct = new beet.BeetArgsStruct<
  ChangeEarlyUnlockFeeInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['earlyUnlockFee', beet.u64],
  ],
  'ChangeEarlyUnlockFeeInstructionArgs'
)
/**
 * Accounts required by the _changeEarlyUnlockFee_ instruction
 *
 * @property [_writable_] state
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category ChangeEarlyUnlockFee
 * @category generated
 */
export type ChangeEarlyUnlockFeeInstructionAccounts = {
  state: web3.PublicKey
  authority: web3.PublicKey
}

export const changeEarlyUnlockFeeInstructionDiscriminator = [
  67, 66, 59, 244, 200, 244, 150, 41,
]

/**
 * Creates a _ChangeEarlyUnlockFee_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category ChangeEarlyUnlockFee
 * @category generated
 */
export function createChangeEarlyUnlockFeeInstruction(
  accounts: ChangeEarlyUnlockFeeInstructionAccounts,
  args: ChangeEarlyUnlockFeeInstructionArgs,
  programId = new web3.PublicKey('EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU')
) {
  const [data] = changeEarlyUnlockFeeStruct.serialize({
    instructionDiscriminator: changeEarlyUnlockFeeInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.state,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
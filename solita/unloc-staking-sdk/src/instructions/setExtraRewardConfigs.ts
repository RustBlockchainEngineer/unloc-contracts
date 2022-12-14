/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import {
  DurationExtraRewardConfig,
  durationExtraRewardConfigBeet,
} from '../types/DurationExtraRewardConfig'

/**
 * @category Instructions
 * @category SetExtraRewardConfigs
 * @category generated
 */
export type SetExtraRewardConfigsInstructionArgs = {
  configs: DurationExtraRewardConfig[]
}
/**
 * @category Instructions
 * @category SetExtraRewardConfigs
 * @category generated
 */
export const setExtraRewardConfigsStruct = new beet.FixableBeetArgsStruct<
  SetExtraRewardConfigsInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['configs', beet.array(durationExtraRewardConfigBeet)],
  ],
  'SetExtraRewardConfigsInstructionArgs'
)
/**
 * Accounts required by the _setExtraRewardConfigs_ instruction
 *
 * @property [_writable_] extraRewardAccount
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category SetExtraRewardConfigs
 * @category generated
 */
export type SetExtraRewardConfigsInstructionAccounts = {
  extraRewardAccount: web3.PublicKey
  authority: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const setExtraRewardConfigsInstructionDiscriminator = [
  202, 144, 15, 240, 135, 231, 142, 41,
]

/**
 * Creates a _SetExtraRewardConfigs_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category SetExtraRewardConfigs
 * @category generated
 */
export function createSetExtraRewardConfigsInstruction(
  accounts: SetExtraRewardConfigsInstructionAccounts,
  args: SetExtraRewardConfigsInstructionArgs,
  programId = new web3.PublicKey('EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU')
) {
  const [data] = setExtraRewardConfigsStruct.serialize({
    instructionDiscriminator: setExtraRewardConfigsInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.extraRewardAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}

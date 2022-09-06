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
 * @category ChangeTokensPerSecond
 * @category generated
 */
export type ChangeTokensPerSecondInstructionArgs = {
  tokenPerSecond: beet.bignum
}
/**
 * @category Instructions
 * @category ChangeTokensPerSecond
 * @category generated
 */
export const changeTokensPerSecondStruct = new beet.BeetArgsStruct<
  ChangeTokensPerSecondInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['tokenPerSecond', beet.u64],
  ],
  'ChangeTokensPerSecondInstructionArgs'
)
/**
 * Accounts required by the _changeTokensPerSecond_ instruction
 *
 * @property [_writable_] state
 * @property [_writable_, **signer**] authority
 * @property [] clock
 * @category Instructions
 * @category ChangeTokensPerSecond
 * @category generated
 */
export type ChangeTokensPerSecondInstructionAccounts = {
  state: web3.PublicKey
  authority: web3.PublicKey
  clock: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const changeTokensPerSecondInstructionDiscriminator = [
  214, 20, 101, 136, 184, 47, 4, 35,
]

/**
 * Creates a _ChangeTokensPerSecond_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category ChangeTokensPerSecond
 * @category generated
 */
export function createChangeTokensPerSecondInstruction(
  accounts: ChangeTokensPerSecondInstructionAccounts,
  args: ChangeTokensPerSecondInstructionArgs,
  programId = new web3.PublicKey('EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU')
) {
  const [data] = changeTokensPerSecondStruct.serialize({
    instructionDiscriminator: changeTokensPerSecondInstructionDiscriminator,
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
    {
      pubkey: accounts.clock,
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

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
 * @category CreatePool
 * @category generated
 */
export type CreatePoolInstructionArgs = {
  bump: number
  point: beet.bignum
  amountMultipler: beet.bignum
}
/**
 * @category Instructions
 * @category CreatePool
 * @category generated
 */
export const createPoolStruct = new beet.BeetArgsStruct<
  CreatePoolInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['point', beet.u64],
    ['amountMultipler', beet.u64],
  ],
  'CreatePoolInstructionArgs'
)
/**
 * Accounts required by the _createPool_ instruction
 *
 * @property [_writable_] pool
 * @property [_writable_] state
 * @property [] mint
 * @property [] vault
 * @property [_writable_, **signer**] authority
 * @property [_writable_, **signer**] payer
 * @property [] clock
 * @category Instructions
 * @category CreatePool
 * @category generated
 */
export type CreatePoolInstructionAccounts = {
  pool: web3.PublicKey
  state: web3.PublicKey
  mint: web3.PublicKey
  vault: web3.PublicKey
  authority: web3.PublicKey
  payer: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  clock: web3.PublicKey
}

export const createPoolInstructionDiscriminator = [
  233, 146, 209, 142, 207, 104, 64, 188,
]

/**
 * Creates a _CreatePool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CreatePool
 * @category generated
 */
export function createCreatePoolInstruction(
  accounts: CreatePoolInstructionAccounts,
  args: CreatePoolInstructionArgs,
  programId = new web3.PublicKey('EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU')
) {
  const [data] = createPoolStruct.serialize({
    instructionDiscriminator: createPoolInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.pool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.state,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.mint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.vault,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
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

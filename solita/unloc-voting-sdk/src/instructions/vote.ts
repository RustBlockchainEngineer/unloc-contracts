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
 * @category Vote
 * @category generated
 */
export const voteStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'VoteInstructionArgs'
)
/**
 * Accounts required by the _vote_ instruction
 *
 * @property [_writable_, **signer**] user
 * @property [_writable_, **signer**] payer
 * @property [_writable_] globalState
 * @property [_writable_] voting
 * @property [_writable_] votingItem
 * @property [_writable_] votingUser
 * @property [_writable_] stakingUser
 * @category Instructions
 * @category Vote
 * @category generated
 */
export type VoteInstructionAccounts = {
  user: web3.PublicKey
  payer: web3.PublicKey
  globalState: web3.PublicKey
  voting: web3.PublicKey
  votingItem: web3.PublicKey
  votingUser: web3.PublicKey
  stakingUser: web3.PublicKey
  systemProgram?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  rent?: web3.PublicKey
}

export const voteInstructionDiscriminator = [
  227, 110, 155, 23, 136, 126, 172, 25,
]

/**
 * Creates a _Vote_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category Vote
 * @category generated
 */
export function createVoteInstruction(
  accounts: VoteInstructionAccounts,
  programId = new web3.PublicKey('6z6RuFauTG511XRakJnPhxUTCVPohv6oC69xieMdm4Z9')
) {
  const [data] = voteStruct.serialize({
    instructionDiscriminator: voteInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.user,
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
      pubkey: accounts.votingUser,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.stakingUser,
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

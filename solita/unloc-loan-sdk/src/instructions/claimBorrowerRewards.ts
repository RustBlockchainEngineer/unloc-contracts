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
 * @category ClaimBorrowerRewards
 * @category generated
 */
export const claimBorrowerRewardsStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'ClaimBorrowerRewardsInstructionArgs'
)
/**
 * Accounts required by the _claimBorrowerRewards_ instruction
 *
 * @property [_writable_, **signer**] authority
 * @property [] globalState
 * @property [_writable_] subOffer
 * @property [_writable_] rewardVault
 * @property [] chainlinkProgram
 * @property [] solFeed
 * @property [] usdcFeed
 * @property [_writable_] borrowerRewardVault
 * @property [] clock
 * @category Instructions
 * @category ClaimBorrowerRewards
 * @category generated
 */
export type ClaimBorrowerRewardsInstructionAccounts = {
  authority: web3.PublicKey
  globalState: web3.PublicKey
  subOffer: web3.PublicKey
  rewardVault: web3.PublicKey
  chainlinkProgram: web3.PublicKey
  solFeed: web3.PublicKey
  usdcFeed: web3.PublicKey
  borrowerRewardVault: web3.PublicKey
  tokenProgram?: web3.PublicKey
  clock: web3.PublicKey
}

export const claimBorrowerRewardsInstructionDiscriminator = [
  7, 235, 76, 84, 43, 189, 103, 106,
]

/**
 * Creates a _ClaimBorrowerRewards_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category ClaimBorrowerRewards
 * @category generated
 */
export function createClaimBorrowerRewardsInstruction(
  accounts: ClaimBorrowerRewardsInstructionAccounts,
  programId = new web3.PublicKey('6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh')
) {
  const [data] = claimBorrowerRewardsStruct.serialize({
    instructionDiscriminator: claimBorrowerRewardsInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.globalState,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.subOffer,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.rewardVault,
      isWritable: true,
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
      pubkey: accounts.borrowerRewardVault,
      isWritable: true,
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
/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link VotingUser}
 * @category Accounts
 * @category generated
 */
export type VotingUserArgs = {
  owner: web3.PublicKey
  voting: web3.PublicKey
  votingItem: web3.PublicKey
  votingScore: beet.bignum
}

export const votingUserDiscriminator = [168, 167, 179, 251, 217, 44, 137, 10]
/**
 * Holds the data for the {@link VotingUser} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class VotingUser implements VotingUserArgs {
  private constructor(
    readonly owner: web3.PublicKey,
    readonly voting: web3.PublicKey,
    readonly votingItem: web3.PublicKey,
    readonly votingScore: beet.bignum
  ) {}

  /**
   * Creates a {@link VotingUser} instance from the provided args.
   */
  static fromArgs(args: VotingUserArgs) {
    return new VotingUser(
      args.owner,
      args.voting,
      args.votingItem,
      args.votingScore
    )
  }

  /**
   * Deserializes the {@link VotingUser} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [VotingUser, number] {
    return VotingUser.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link VotingUser} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<VotingUser> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find VotingUser account at ${address}`)
    }
    return VotingUser.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Deserializes the {@link VotingUser} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [VotingUser, number] {
    return votingUserBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link VotingUser} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return votingUserBeet.serialize({
      accountDiscriminator: votingUserDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link VotingUser}
   */
  static get byteSize() {
    return votingUserBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link VotingUser} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      VotingUser.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link VotingUser} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === VotingUser.byteSize
  }

  /**
   * Returns a readable version of {@link VotingUser} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      owner: this.owner.toBase58(),
      voting: this.voting.toBase58(),
      votingItem: this.votingItem.toBase58(),
      votingScore: (() => {
        const x = <{ toNumber: () => number }>this.votingScore
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const votingUserBeet = new beet.BeetStruct<
  VotingUser,
  VotingUserArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['owner', beetSolana.publicKey],
    ['voting', beetSolana.publicKey],
    ['votingItem', beetSolana.publicKey],
    ['votingScore', beet.u128],
  ],
  VotingUser.fromArgs,
  'VotingUser'
)

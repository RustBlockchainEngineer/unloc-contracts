/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * Arguments used to create {@link Voting}
 * @category Accounts
 * @category generated
 */
export type VotingArgs = {
  votingNumber: beet.bignum
  votingStartTimestamp: beet.bignum
  votingEndTimestamp: beet.bignum
  totalScore: beet.bignum
  totalItems: beet.bignum
}

export const votingDiscriminator = [69, 100, 149, 245, 199, 83, 2, 60]
/**
 * Holds the data for the {@link Voting} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Voting implements VotingArgs {
  private constructor(
    readonly votingNumber: beet.bignum,
    readonly votingStartTimestamp: beet.bignum,
    readonly votingEndTimestamp: beet.bignum,
    readonly totalScore: beet.bignum,
    readonly totalItems: beet.bignum
  ) {}

  /**
   * Creates a {@link Voting} instance from the provided args.
   */
  static fromArgs(args: VotingArgs) {
    return new Voting(
      args.votingNumber,
      args.votingStartTimestamp,
      args.votingEndTimestamp,
      args.totalScore,
      args.totalItems
    )
  }

  /**
   * Deserializes the {@link Voting} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [Voting, number] {
    return Voting.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Voting} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<Voting> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find Voting account at ${address}`)
    }
    return Voting.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Deserializes the {@link Voting} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Voting, number] {
    return votingBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Voting} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return votingBeet.serialize({
      accountDiscriminator: votingDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Voting}
   */
  static get byteSize() {
    return votingBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Voting} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      Voting.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Voting} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Voting.byteSize
  }

  /**
   * Returns a readable version of {@link Voting} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      votingNumber: (() => {
        const x = <{ toNumber: () => number }>this.votingNumber
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      votingStartTimestamp: (() => {
        const x = <{ toNumber: () => number }>this.votingStartTimestamp
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      votingEndTimestamp: (() => {
        const x = <{ toNumber: () => number }>this.votingEndTimestamp
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      totalScore: (() => {
        const x = <{ toNumber: () => number }>this.totalScore
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      totalItems: (() => {
        const x = <{ toNumber: () => number }>this.totalItems
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
export const votingBeet = new beet.BeetStruct<
  Voting,
  VotingArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['votingNumber', beet.u64],
    ['votingStartTimestamp', beet.u64],
    ['votingEndTimestamp', beet.u64],
    ['totalScore', beet.u128],
    ['totalItems', beet.u64],
  ],
  Voting.fromArgs,
  'Voting'
)

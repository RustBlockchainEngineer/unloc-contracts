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
 * Arguments used to create {@link FarmPoolUserAccount}
 * @category Accounts
 * @category generated
 */
export type FarmPoolUserAccountArgs = {
  bump: number
  pool: web3.PublicKey
  authority: web3.PublicKey
  amount: beet.bignum
  rewardAmount: beet.bignum
  extraReward: beet.bignum
  rewardDebt: beet.bignum
  lastStakeTime: beet.bignum
  lockDuration: beet.bignum
  unlocScore: beet.bignum
  profileLevel: beet.bignum
  reserved1: beet.bignum
  reserved2: beet.bignum
  reserved3: beet.bignum
}

export const farmPoolUserAccountDiscriminator = [
  114, 101, 19, 16, 3, 74, 14, 54,
]
/**
 * Holds the data for the {@link FarmPoolUserAccount} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class FarmPoolUserAccount implements FarmPoolUserAccountArgs {
  private constructor(
    readonly bump: number,
    readonly pool: web3.PublicKey,
    readonly authority: web3.PublicKey,
    readonly amount: beet.bignum,
    readonly rewardAmount: beet.bignum,
    readonly extraReward: beet.bignum,
    readonly rewardDebt: beet.bignum,
    readonly lastStakeTime: beet.bignum,
    readonly lockDuration: beet.bignum,
    readonly unlocScore: beet.bignum,
    readonly profileLevel: beet.bignum,
    readonly reserved1: beet.bignum,
    readonly reserved2: beet.bignum,
    readonly reserved3: beet.bignum
  ) {}

  /**
   * Creates a {@link FarmPoolUserAccount} instance from the provided args.
   */
  static fromArgs(args: FarmPoolUserAccountArgs) {
    return new FarmPoolUserAccount(
      args.bump,
      args.pool,
      args.authority,
      args.amount,
      args.rewardAmount,
      args.extraReward,
      args.rewardDebt,
      args.lastStakeTime,
      args.lockDuration,
      args.unlocScore,
      args.profileLevel,
      args.reserved1,
      args.reserved2,
      args.reserved3
    )
  }

  /**
   * Deserializes the {@link FarmPoolUserAccount} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [FarmPoolUserAccount, number] {
    return FarmPoolUserAccount.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link FarmPoolUserAccount} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<FarmPoolUserAccount> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(
        `Unable to find FarmPoolUserAccount account at ${address}`
      )
    }
    return FarmPoolUserAccount.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Deserializes the {@link FarmPoolUserAccount} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [FarmPoolUserAccount, number] {
    return farmPoolUserAccountBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link FarmPoolUserAccount} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return farmPoolUserAccountBeet.serialize({
      accountDiscriminator: farmPoolUserAccountDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link FarmPoolUserAccount}
   */
  static get byteSize() {
    return farmPoolUserAccountBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link FarmPoolUserAccount} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      FarmPoolUserAccount.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link FarmPoolUserAccount} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === FarmPoolUserAccount.byteSize
  }

  /**
   * Returns a readable version of {@link FarmPoolUserAccount} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      bump: this.bump,
      pool: this.pool.toBase58(),
      authority: this.authority.toBase58(),
      amount: (() => {
        const x = <{ toNumber: () => number }>this.amount
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      rewardAmount: (() => {
        const x = <{ toNumber: () => number }>this.rewardAmount
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      extraReward: (() => {
        const x = <{ toNumber: () => number }>this.extraReward
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      rewardDebt: (() => {
        const x = <{ toNumber: () => number }>this.rewardDebt
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      lastStakeTime: (() => {
        const x = <{ toNumber: () => number }>this.lastStakeTime
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      lockDuration: (() => {
        const x = <{ toNumber: () => number }>this.lockDuration
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      unlocScore: (() => {
        const x = <{ toNumber: () => number }>this.unlocScore
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      profileLevel: (() => {
        const x = <{ toNumber: () => number }>this.profileLevel
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      reserved1: (() => {
        const x = <{ toNumber: () => number }>this.reserved1
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      reserved2: (() => {
        const x = <{ toNumber: () => number }>this.reserved2
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      reserved3: (() => {
        const x = <{ toNumber: () => number }>this.reserved3
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
export const farmPoolUserAccountBeet = new beet.BeetStruct<
  FarmPoolUserAccount,
  FarmPoolUserAccountArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['pool', beetSolana.publicKey],
    ['authority', beetSolana.publicKey],
    ['amount', beet.u64],
    ['rewardAmount', beet.u128],
    ['extraReward', beet.u128],
    ['rewardDebt', beet.u128],
    ['lastStakeTime', beet.i64],
    ['lockDuration', beet.i64],
    ['unlocScore', beet.u128],
    ['profileLevel', beet.u64],
    ['reserved1', beet.u128],
    ['reserved2', beet.u128],
    ['reserved3', beet.u128],
  ],
  FarmPoolUserAccount.fromArgs,
  'FarmPoolUserAccount'
)
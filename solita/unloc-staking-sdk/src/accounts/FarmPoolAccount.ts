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
 * Arguments used to create {@link FarmPoolAccount}
 * @category Accounts
 * @category generated
 */
export type FarmPoolAccountArgs = {
  bump: number
  authority: web3.PublicKey
  amount: beet.bignum
  mint: web3.PublicKey
  vault: web3.PublicKey
  point: beet.bignum
  lastRewardTime: beet.bignum
  accRewardPerShare: beet.bignum
  amountMultipler: beet.bignum
  totalUser: beet.bignum
}

export const farmPoolAccountDiscriminator = [44, 66, 129, 113, 105, 164, 53, 73]
/**
 * Holds the data for the {@link FarmPoolAccount} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class FarmPoolAccount implements FarmPoolAccountArgs {
  private constructor(
    readonly bump: number,
    readonly authority: web3.PublicKey,
    readonly amount: beet.bignum,
    readonly mint: web3.PublicKey,
    readonly vault: web3.PublicKey,
    readonly point: beet.bignum,
    readonly lastRewardTime: beet.bignum,
    readonly accRewardPerShare: beet.bignum,
    readonly amountMultipler: beet.bignum,
    readonly totalUser: beet.bignum
  ) {}

  /**
   * Creates a {@link FarmPoolAccount} instance from the provided args.
   */
  static fromArgs(args: FarmPoolAccountArgs) {
    return new FarmPoolAccount(
      args.bump,
      args.authority,
      args.amount,
      args.mint,
      args.vault,
      args.point,
      args.lastRewardTime,
      args.accRewardPerShare,
      args.amountMultipler,
      args.totalUser
    )
  }

  /**
   * Deserializes the {@link FarmPoolAccount} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [FarmPoolAccount, number] {
    return FarmPoolAccount.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link FarmPoolAccount} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<FarmPoolAccount> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find FarmPoolAccount account at ${address}`)
    }
    return FarmPoolAccount.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, farmPoolAccountBeet)
  }

  /**
   * Deserializes the {@link FarmPoolAccount} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [FarmPoolAccount, number] {
    return farmPoolAccountBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link FarmPoolAccount} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return farmPoolAccountBeet.serialize({
      accountDiscriminator: farmPoolAccountDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link FarmPoolAccount}
   */
  static get byteSize() {
    return farmPoolAccountBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link FarmPoolAccount} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      FarmPoolAccount.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link FarmPoolAccount} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === FarmPoolAccount.byteSize
  }

  /**
   * Returns a readable version of {@link FarmPoolAccount} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      bump: this.bump,
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
      mint: this.mint.toBase58(),
      vault: this.vault.toBase58(),
      point: (() => {
        const x = <{ toNumber: () => number }>this.point
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      lastRewardTime: (() => {
        const x = <{ toNumber: () => number }>this.lastRewardTime
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      accRewardPerShare: (() => {
        const x = <{ toNumber: () => number }>this.accRewardPerShare
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      amountMultipler: (() => {
        const x = <{ toNumber: () => number }>this.amountMultipler
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      totalUser: (() => {
        const x = <{ toNumber: () => number }>this.totalUser
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
export const farmPoolAccountBeet = new beet.BeetStruct<
  FarmPoolAccount,
  FarmPoolAccountArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['authority', beetSolana.publicKey],
    ['amount', beet.u64],
    ['mint', beetSolana.publicKey],
    ['vault', beetSolana.publicKey],
    ['point', beet.u64],
    ['lastRewardTime', beet.i64],
    ['accRewardPerShare', beet.u128],
    ['amountMultipler', beet.u64],
    ['totalUser', beet.u64],
  ],
  FarmPoolAccount.fromArgs,
  'FarmPoolAccount'
)

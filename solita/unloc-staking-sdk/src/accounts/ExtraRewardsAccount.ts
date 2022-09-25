/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import {
  DurationExtraRewardConfig,
  durationExtraRewardConfigBeet,
} from '../types/DurationExtraRewardConfig'

/**
 * Arguments used to create {@link ExtraRewardsAccount}
 * @category Accounts
 * @category generated
 */
export type ExtraRewardsAccountArgs = {
  bump: number
  authority: web3.PublicKey
  configs: DurationExtraRewardConfig[]
}

export const extraRewardsAccountDiscriminator = [
  72, 97, 13, 222, 207, 85, 147, 59,
]
/**
 * Holds the data for the {@link ExtraRewardsAccount} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class ExtraRewardsAccount implements ExtraRewardsAccountArgs {
  private constructor(
    readonly bump: number,
    readonly authority: web3.PublicKey,
    readonly configs: DurationExtraRewardConfig[]
  ) {}

  /**
   * Creates a {@link ExtraRewardsAccount} instance from the provided args.
   */
  static fromArgs(args: ExtraRewardsAccountArgs) {
    return new ExtraRewardsAccount(args.bump, args.authority, args.configs)
  }

  /**
   * Deserializes the {@link ExtraRewardsAccount} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [ExtraRewardsAccount, number] {
    return ExtraRewardsAccount.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link ExtraRewardsAccount} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<ExtraRewardsAccount> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(
        `Unable to find ExtraRewardsAccount account at ${address}`
      )
    }
    return ExtraRewardsAccount.fromAccountInfo(accountInfo, 0)[0]
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
    return beetSolana.GpaBuilder.fromStruct(programId, extraRewardsAccountBeet)
  }

  /**
   * Deserializes the {@link ExtraRewardsAccount} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [ExtraRewardsAccount, number] {
    return extraRewardsAccountBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link ExtraRewardsAccount} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return extraRewardsAccountBeet.serialize({
      accountDiscriminator: extraRewardsAccountDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link ExtraRewardsAccount} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: ExtraRewardsAccountArgs) {
    const instance = ExtraRewardsAccount.fromArgs(args)
    return extraRewardsAccountBeet.toFixedFromValue({
      accountDiscriminator: extraRewardsAccountDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link ExtraRewardsAccount} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: ExtraRewardsAccountArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      ExtraRewardsAccount.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link ExtraRewardsAccount} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      bump: this.bump,
      authority: this.authority.toBase58(),
      configs: this.configs,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const extraRewardsAccountBeet = new beet.FixableBeetStruct<
  ExtraRewardsAccount,
  ExtraRewardsAccountArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['authority', beetSolana.publicKey],
    ['configs', beet.array(durationExtraRewardConfigBeet)],
  ],
  ExtraRewardsAccount.fromArgs,
  'ExtraRewardsAccount'
)

import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export interface IOfferData {
  tokenAccount?: PublicKey
  collection: string
  mint: string
  metadata: IMetadata
}

export interface IMasterEdition {
  masterEditionPDA: string
  masterEditionData?: MasterEditionData
}

export interface MasterEditionData {
  key: number
  supply: BN
  maxSupply?: BN
}

export interface IMetadata {
  metadataPDA: string
  onChainMetadata: OnChainMetadata
  arweaveMetadata: ArweaveMetadata
}

export interface ArweaveMetadata {
  image: string
  name: string
  symbol: string
  collection: CollectionClass | string
  attributes?: Attribute[]
  seller_fee_basis_points: number
  properties: Properties
  description?: string
  uri?: string
  external_url?: string
  update_authority?: string
  primary_sale_happened?: boolean
  is_mutable?: boolean
}

export interface Attribute {
  trait_type: string
  value: number | string
  display_type?: string
}

export interface CollectionClass {
  name: string
  family: string
}

export interface Properties {
  creators?: PropertiesCreator[]
  files: File[]
  category?: string
}

export interface PropertiesCreator {
  address: string
  share: number
  verified?: boolean | number
}

export interface File {
  uri: string
  type: string
}

export interface OnChainMetadata {
  key: number
  updateAuthority: string
  mint: string
  data: Data
  primarySaleHappened: boolean
  isMutable: boolean
}

export interface Data {
  name: string
  symbol: string
  uri: string
  sellerFeeBasisPoints: number
  creators: Creator[] | null
}

export interface Creator {
  address: string
  verified: boolean
  share: number
}

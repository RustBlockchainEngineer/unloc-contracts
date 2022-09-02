export * from './ExtraRewardsAccount'
export * from './FarmPoolAccount'
export * from './FarmPoolUserAccount'
export * from './StateAccount'

import { ExtraRewardsAccount } from './ExtraRewardsAccount'
import { FarmPoolAccount } from './FarmPoolAccount'
import { StateAccount } from './StateAccount'
import { FarmPoolUserAccount } from './FarmPoolUserAccount'

export const accountProviders = {
  ExtraRewardsAccount,
  FarmPoolAccount,
  StateAccount,
  FarmPoolUserAccount,
}

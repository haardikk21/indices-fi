import type { AccountView } from 'near-api-js/lib/providers/provider'

export type Account = AccountView & {
  account_id: string
}

export type FungibleTokenMetadata = {
  spec: string
  name: string
  symbol: string
  icon?: string
  reference?: string
  reference_hash?: string
  decimals: number
}

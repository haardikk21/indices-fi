import {
  MANAGER_CONTRACT_ID,
  TESTNET_NODE_URL,
  WNEAR_CONTRACT,
} from '@/constants'
import {
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  ftGetTokensMetadata,
  getExpectedOutputFromSwapTodos,
  init_env,
  REF_FI_CONTRACT_ID,
} from '@ref-finance/ref-sdk'
import { FungibleTokenMetadata } from 'interfaces'
import { providers } from 'near-api-js'
import { CodeResult } from 'near-api-js/lib/providers/provider'

export async function getAllIndexTokens(): Promise<string[]> {
  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })

  const data = await provider.query<CodeResult>({
    request_type: 'call_function',
    account_id: MANAGER_CONTRACT_ID,
    method_name: 'get_index_tokens',
    args_base64: '',
    finality: 'optimistic',
  })
  const indexTokens: string[] = JSON.parse(Buffer.from(data.result).toString())
  return indexTokens
}

export async function getFTMetadata(
  tokens: string[]
): Promise<FungibleTokenMetadata[]> {
  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })

  const promises = []
  for (let index of tokens) {
    const metadataPromise = provider
      .query<CodeResult>({
        request_type: 'call_function',
        account_id: index,
        method_name: 'ft_metadata',
        args_base64: '',
        finality: 'optimistic',
      })
      .then((res) => JSON.parse(Buffer.from(res.result).toString()))
    promises.push(metadataPromise)
  }
  const metadata: FungibleTokenMetadata[] = await Promise.all(promises)

  return metadata
}

export async function getTokenInfosForOwner(accountId: string) {
  const { tokens, metadata } = await getIndexTokensAndMetadata()

  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })
  // Get user balances for tokens
  const promises = []
  const underlyingTokensForIndexes = []
  const underlyingTokenPricesForIndexes = []
  for (let index of tokens) {
    const balancePromise = provider
      .query<CodeResult>({
        request_type: 'call_function',
        account_id: index,
        method_name: 'ft_balance_of',
        args_base64: Buffer.from(
          JSON.stringify({ account_id: accountId }),
          'utf-8'
        ).toString('base64'),
        finality: 'optimistic',
      })
      .then((res) => JSON.parse(Buffer.from(res.result).toString()))
    promises.push(balancePromise)
    const underlyingTokens = await getUnderlyingTokens(index)
    const underlyingTokenPrices = await getUnderlyingTokenPricesForToken(index)
    underlyingTokensForIndexes.push(underlyingTokens)
    underlyingTokenPricesForIndexes.push(underlyingTokenPrices)
  }
  const balances: string[] = await Promise.all(promises)

  const tokenBalances = tokens
    .map((token, i) => {
      const totalPrice = underlyingTokenPricesForIndexes[i].reduce(
        (prev, curr) => prev + Number(curr.price),
        0
      )
      if (BigInt(balances[i]) > 0) {
        return {
          token,
          metadata: metadata[i],
          balance: balances[i],
          price: totalPrice.toFixed(2) as number,
          underlyingTokens: underlyingTokensForIndexes[i],
        }
      }
      return null
    })
    .filter((x) => x !== null)

  return tokenBalances
}

export async function getIndexTokensAndMetadata(): Promise<{
  tokens: string[]
  metadata: FungibleTokenMetadata[]
}> {
  const tokens = await getAllIndexTokens()
  const metadata = await getFTMetadata(tokens)

  return {
    tokens,
    metadata,
  }
}

export async function getUnderlyingTokens(
  indexToken: string
): Promise<string[]> {
  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })

  const data = await provider
    .query<CodeResult>({
      request_type: 'call_function',
      account_id: indexToken,
      method_name: 'get_underlying_tokens',
      args_base64: '',
      finality: 'optimistic',
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()))

  return data as string[]
}

export async function getUnderlyingPoolIds(
  indexToken: string
): Promise<number[]> {
  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })

  const data = await provider
    .query<CodeResult>({
      request_type: 'call_function',
      account_id: indexToken,
      method_name: 'get_underlying_poolids',
      args_base64: '',
      finality: 'optimistic',
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()))

  return data as number[]
}

export async function getUnderlyingTokenPricesForTokens(indexTokens: string[]) {
  init_env('testnet')

  const amountOuts = []
  for (let token of indexTokens) {
    const prices = await getUnderlyingTokenPricesForToken(token)
    amountOuts.push(prices)
  }

  return amountOuts
}

export async function getUnderlyingTokenPricesForToken(indexToken: string) {
  const provider = new providers.JsonRpcProvider({ url: TESTNET_NODE_URL })

  const underlyingTokens = await getUnderlyingTokens(indexToken)
  const underlyingPoolIds = await getUnderlyingPoolIds(indexToken)
  const amountOuts = []

  for (let i = 0; i < underlyingTokens.length; i++) {
    const token = underlyingTokens[i]
    const poolId = underlyingPoolIds[i]
    console.log({
      pool_id: poolId,
      token_in: token,
      amount_in: '1',
      token_out: 'wrap.testnet',
    })
    const data = await provider
      .query<CodeResult>({
        request_type: 'call_function',
        account_id: 'ref-finance-101.testnet',
        method_name: 'get_return',
        args_base64: Buffer.from(
          JSON.stringify({
            pool_id: poolId,
            token_in: token,
            amount_in: '1',
            token_out: 'wrap.testnet',
          }),
          'utf-8'
        ).toString('base64'),
        finality: 'optimistic',
      })
      .then((res) => JSON.parse(Buffer.from(res.result).toString()))
      .catch((err) => {
        console.error(err)
        console.log(`Failed at ${token}`)
      })

    amountOuts.push({
      token: token,
      price: data,
    })
  }

  return amountOuts
}

export async function getAllSimplePoolsWithWNEAR() {
  init_env('testnet')

  const { simplePools } = await fetchAllPools()

  const wnearPools = simplePools.filter((p) => {
    return p.tokenIds.includes(WNEAR_CONTRACT)
  })

  return wnearPools
}

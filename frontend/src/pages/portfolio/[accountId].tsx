import { getTokenInfosForOwner } from '@/utils/viewMethods'
import { FungibleTokenMetadata } from 'interfaces'
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'
import { useWalletSelector } from '@/contexts/WalletSelectorContext'
import { MANAGER_CONTRACT_ID, THREE_HUNDRED_TGAS } from '@/constants'
import { utils } from 'near-api-js'
import { NoResultsFound } from '@/components/NoResultsFound'

type TokenInfo = {
  token: string
  metadata: FungibleTokenMetadata
  balance: string
  price: number
  underlyingTokens: string[]
}

export const getServerSideProps: GetServerSideProps<{
  tokenInfo: TokenInfo[]
}> = async (context) => {
  const accountId = context.query.accountId as string
  const tokenInfo: TokenInfo[] = await getTokenInfosForOwner(accountId)
  return {
    props: { tokenInfo },
  }
}

const PortfolioPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ tokenInfo }) => {
  const { selector, accountId } = useWalletSelector()

  const handleRedeem = async (tokenInfo: TokenInfo) => {
    const wallet = await selector.wallet()
    return wallet.signAndSendTransactions({
      transactions: [
        {
          signerId: accountId,
          receiverId: tokenInfo.token,
          actions: [
            {
              type: 'FunctionCall',
              params: {
                methodName: 'redeem_index_token',
                args: { token_amount: tokenInfo.balance },
                gas: THREE_HUNDRED_TGAS,
                deposit: '1',
              },
            },
          ],
        },
      ],
    })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col justify-center py-12 sm:px-6 lg:px-8">
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Portfolio
      </h2>

      <div className="mt-8 flex flex-col">
        {tokenInfo.length > 0 ? (
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Tokens
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Balance
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Value
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Redeem</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {tokenInfo.map((tokenInfo) => (
                      <tr key={tokenInfo.token}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {tokenInfo.token}
                        </td>
                        <td className="flex gap-2 whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {tokenInfo.underlyingTokens.map((ut, i) => (
                            <span
                              key={`underlying-token-${i}`}
                              className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                            >
                              {ut.replace('.testnet', '')}
                            </span>
                          ))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {tokenInfo.balance}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {Number(tokenInfo.balance) * tokenInfo.price} yN
                        </td>
                        <td
                          onClick={() => handleRedeem(tokenInfo)}
                          className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                        >
                          <a
                            href="#"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Redeem
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <NoResultsFound
            title="Your portfolio is empty"
            description="You haven't bought any index tokens yet. Click below to get started"
            cta="Explore Indices"
            href="/explore"
          />
        )}
      </div>
    </div>
  )
}

export default PortfolioPage

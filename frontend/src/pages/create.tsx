import { TokenSelectList } from '@/components/TokenSelectList'
import {
  MANAGER_CONTRACT_ID,
  THREE_HUNDRED_TGAS,
  WNEAR_CONTRACT,
} from '@/constants'
import { useWalletSelector } from '@/contexts/WalletSelectorContext'
import { useCreateIndexStore } from '@/stores/useCreateIndexStore'
import { getAllSimplePoolsWithWNEAR } from '@/utils/viewMethods'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { getGlobalWhitelist } from '@ref-finance/ref-sdk'
import { utils } from 'near-api-js'
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'

export const getServerSideProps: GetServerSideProps<{
  tokensList: { name: string; poolId: number }[]
}> = async () => {
  const wnearPools = await getAllSimplePoolsWithWNEAR()
  const globalWhitelist = await getGlobalWhitelist()

  const whitelistedPools = wnearPools.filter((p) => {
    return globalWhitelist.some(
      (w) => p.tokenIds.includes(w) && w !== WNEAR_CONTRACT
    )
  })

  const tokensList = whitelistedPools.map((p) => {
    return {
      name: p.tokenIds.find((id) => id !== WNEAR_CONTRACT),
      poolId: p.id,
    }
  })

  return {
    props: {
      tokensList,
    },
  }
}

const CreatePage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ tokensList }) => {
  const { selector, accountId } = useWalletSelector()
  const store = useCreateIndexStore()

  const createIndexToken = async () => {
    const wallet = await selector.wallet()
    return wallet.signAndSendTransactions({
      transactions: [
        {
          signerId: accountId,
          receiverId: MANAGER_CONTRACT_ID,
          actions: [
            {
              type: 'FunctionCall',
              params: {
                methodName: 'deploy_new_index',
                args: store.args,
                gas: THREE_HUNDRED_TGAS,
                deposit: utils.format.parseNearAmount('26'),
              },
            },
          ],
        },
      ],
    })
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Create a new index token
      </h2>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="index-name"
                className="block text-sm font-medium text-gray-700"
              >
                Index Name
              </label>
              <div className="mt-1">
                <input
                  id="index-name"
                  name="index-name"
                  type="text"
                  autoComplete="text"
                  required
                  placeholder="NEAR Bull Token"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={store.args.metadata.name}
                  onChange={(e) => store.setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="index-symbol"
                className="block text-sm font-medium text-gray-700"
              >
                Index Symbol
              </label>
              <div className="mt-1">
                <input
                  id="index-symbol"
                  name="index-symbol"
                  type="text"
                  autoComplete="text"
                  placeholder="NEARBULL"
                  required
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={store.args.metadata.symbol}
                  onChange={(e) => store.setSymbol(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="index-token"
                className="block text-sm font-medium text-gray-700"
              >
                Underlying Tokens
              </label>
              <div className="mt-1 flex flex-col gap-2">
                {store.args.tokens.map((t, i) => (
                  <div
                    key={`index-token-${i}`}
                    className="flex items-center gap-2"
                  >
                    <TokenSelectList index={i} tokens={tokensList} />
                    <XMarkIcon
                      className="h-4 cursor-pointer"
                      onClick={() => {
                        store.removeToken(t)
                      }}
                    />
                  </div>
                ))}
                <p
                  className="mt-2 text-sm text-gray-600"
                  onClick={() => store.addToken()}
                >
                  +{' '}
                  <a
                    href="#"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Add new token
                  </a>
                </p>
              </div>
            </div>

            <div>
              <button
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600"
                onClick={createIndexToken}
                disabled={!accountId}
              >
                {accountId ? 'Deploy' : 'Login to Deploy'}
              </button>
              <p className="mt-2 text-center text-sm text-gray-600">
                Need help?{' '}
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Watch a video
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePage

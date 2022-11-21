import { THREE_HUNDRED_TGAS } from '@/constants'
import { useWalletSelector } from '@/contexts/WalletSelectorContext'
import { Dialog, Transition } from '@headlessui/react'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { FungibleTokenMetadata } from 'interfaces'
import { Fragment, useState } from 'react'
import { toast } from 'react-toastify'

interface Props {
  token: string
  metadata: FungibleTokenMetadata
  tokenPrices: {
    token: string
    price: string
  }[]
}

export const IndexTokenCard: React.FC<Props> = (props) => {
  const { selector, accountId } = useWalletSelector()
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState(0)

  const totalPrice = props.tokenPrices.reduce(
    (prev, curr) => prev + Number(curr.price),
    0
  )

  const buyIndexToken = async () => {
    const wallet = await selector.wallet()

    // Get cheapest token
    const cheapestToken = [...props.tokenPrices].sort(
      (a, b) => Number(a.price) - Number(b.price)
    )[0]

    // Minimum purchase amount
    const minPurchase = Math.ceil(1 / Number(cheapestToken.price))

    if (purchaseAmount < minPurchase) {
      toast(`Minimum purchase amount is ${minPurchase}`)
      return
    }

    // Leave buffer room in individual amounts
    const nearAmounts = props.tokenPrices.map((tp) =>
      Math.ceil(Number(tp.price) * purchaseAmount * 5)
    )

    console.log({ tokenPrices: props.tokenPrices })
    console.log({ nearAmounts })

    // Leave buffer room in total spend
    const totalNearSpend = Math.ceil(nearAmounts.reduce((p, c) => p + c, 0) * 5)

    return wallet.signAndSendTransactions({
      transactions: [
        {
          signerId: accountId,
          receiverId: props.token,
          actions: [
            {
              type: 'FunctionCall',
              params: {
                methodName: 'buy_index_token',
                args: {
                  near_amounts: nearAmounts.map((a) => a.toString()),
                  token_amount: purchaseAmount.toString(),
                },
                gas: THREE_HUNDRED_TGAS,
                deposit: totalNearSpend.toString(),
              },
            },
          ],
        },
      ],
    })
  }

  return (
    <>
      <li className="col-span-1 flex cursor-pointer flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-xl transition-all hover:-translate-y-1">
        <div className="flex flex-1 flex-col p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mx-auto h-32 w-32 flex-shrink-0 rounded-full"
            src={
              props.metadata.icon
                ? props.metadata.icon
                : `https://avatar.tobi.sh/${props.metadata.symbol}`
            }
            alt=""
          />
          <h3 className="mt-6 text-sm font-medium text-gray-900">
            ${props.metadata.symbol}
          </h3>
          <dl className="mt-1 flex flex-grow flex-col justify-between">
            <dt className="sr-only">Title</dt>
            <dd className="text-sm text-gray-500">{props.token}</dd>
            <dt className="sr-only">Role</dt>
            <dd className="mt-3 flex w-full flex-wrap justify-center gap-2">
              {props.tokenPrices.map((tp, i) => (
                <span
                  key={`${tp.token}-${i}`}
                  className="w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                >
                  {tp.token.replace('.testnet', '')}
                </span>
              ))}
            </dd>
            <dt className="sr-only">Price</dt>
            <dd className="mt-3 text-sm font-bold text-gray-500">
              1 {props.metadata.symbol} = {totalPrice.toFixed(2)} yN
            </dd>
          </dl>
        </div>

        <div>
          <div className="-mt-px flex divide-x divide-gray-200">
            <div className="flex w-0 flex-1">
              <a
                onClick={() => setShowPurchaseModal(true)}
                className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center rounded-bl-lg border border-transparent py-4 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                <CreditCardIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <span className="ml-3">Buy Index</span>
              </a>
            </div>
          </div>
        </div>
      </li>

      <Transition.Root show={showPurchaseModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={setShowPurchaseModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="lg: relative w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 lg:max-w-lg">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CreditCardIcon
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Buy {props.token}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Great decision! Select how many tokens you want to buy
                          and then make the transaction.
                        </p>

                        <p className="mt-3 text-sm font-bold text-gray-500">
                          1 {props.metadata.symbol} = {totalPrice.toFixed(2)} yN
                        </p>
                      </div>

                      <div className="mt-3">
                        <label
                          htmlFor="purchase-amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Tokens to Purchase
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="purchase-amount"
                            id="purchase-amount"
                            className="mx-auto block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="1"
                            value={purchaseAmount}
                            onChange={(e) =>
                              setPurchaseAmount(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600 sm:text-sm"
                      onClick={accountId ? buyIndexToken : () => {}}
                      disabled={!accountId}
                    >
                      {accountId ? 'Purchase' : 'Login to Purchase'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

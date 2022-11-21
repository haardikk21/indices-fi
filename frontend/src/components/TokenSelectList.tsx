import { useCreateIndexStore } from '@/stores/useCreateIndexStore'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState, Fragment } from 'react'

interface Props {
  tokens: {
    name: string
    poolId: number
  }[]
  index: number
}

export const TokenSelectList: React.FC<Props> = ({ tokens, index }) => {
  const [selected, setSelected] = useState(tokens[0])
  const store = useCreateIndexStore()

  return (
    <Listbox
      value={selected}
      onChange={(t) => {
        setSelected(t)
        store.updateToken(t.name, index)
        store.updatePoolId(t.poolId, index)
      }}
    >
      {({ open }) => (
        <>
          <div className="relative mt-1 w-full">
            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
              <span className="inline-flex w-full truncate">
                <span className="truncate">{selected.name}</span>
                <span className="ml-2 truncate text-gray-500">
                  Pool ID: {selected.poolId}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {tokens.map((token) => (
                  <Listbox.Option
                    key={token.poolId}
                    className={({ active }) =>
                      clsx(
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={token}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex">
                          <span
                            className={clsx(
                              selected ? 'font-semibold' : 'font-normal',
                              'truncate'
                            )}
                          >
                            {token.name}
                          </span>
                          <span
                            className={clsx(
                              active ? 'text-indigo-200' : 'text-gray-500',
                              'ml-2 truncate'
                            )}
                          >
                            Pool ID: {token.poolId}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={clsx(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  )
}

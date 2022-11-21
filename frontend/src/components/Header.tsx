import { Popover, Transition } from '@headlessui/react'
import clsx from 'clsx'
import Link from 'next/link'
import Image from 'next/image'
import { Fragment, useCallback, useState, useEffect } from 'react'
import { Button } from './Button'
import { Container } from './Container'
import { MobileNavLink, NavLink } from './NavLink'
import logo from '@/images/logo.png'
import { useWalletSelector } from '@/contexts/WalletSelectorContext'
import { providers, utils } from 'near-api-js'
import type { AccountView } from 'near-api-js/lib/providers/provider'
import type { Account } from 'interfaces'

const MobileNavIcon: React.FC<{ open: boolean }> = ({ open }) => {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0'
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0'
        )}
      />
    </svg>
  )
}

const MobileNavigation: React.FC = () => {
  const { accountId } = useWalletSelector()

  return (
    <Popover>
      <Popover.Button
        className="relative z-10 flex h-8 w-8 items-center justify-center [&:not(:focus-visible)]:focus:outline-none"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 bg-slate-300/50" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-100 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            as="div"
            className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-2xl bg-white p-4 text-lg tracking-tight text-slate-900 shadow-xl ring-1 ring-slate-900/5"
          >
            <MobileNavLink href="#features">Features</MobileNavLink>
            <MobileNavLink href="#testimonials">Testimonials</MobileNavLink>
            <MobileNavLink href="#faq">FAQ</MobileNavLink>
            {accountId && (
              <MobileNavLink href={`/portfolio/${accountId}`}>
                Portfolio
              </MobileNavLink>
            )}
            <MobileNavLink href="/explore">Explore</MobileNavLink>
            <MobileNavLink href="/create">Create</MobileNavLink>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

export const Header: React.FC = () => {
  const { selector, modal, accounts, accountId } = useWalletSelector()
  const [account, setAccount] = useState<Account | null>(null)

  const getAccount = useCallback(async (): Promise<Account | null> => {
    if (!accountId) {
      return null
    }

    const { network } = selector.options
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl })

    return provider
      .query<AccountView>({
        request_type: 'view_account',
        finality: 'final',
        account_id: accountId,
      })
      .then((data) => ({
        ...data,
        account_id: accountId,
      }))
  }, [accountId, selector.options])

  function handleSignIn() {
    modal.show()
  }

  async function handleSignOut() {
    const wallet = await selector.wallet()

    wallet.signOut().catch((err) => {
      console.error(`Failed to sign out: ${err}`)
    })
  }

  useEffect(() => {
    if (!accountId) {
      return setAccount(null)
    }

    getAccount().then((nextAcc) => {
      setAccount(nextAcc)
    })
  }, [accountId, getAccount])

  return (
    <header className="py-10">
      <Container>
        <nav className="relative z-50 flex justify-between">
          <div className="flex items-center md:gap-x-12">
            <Link href="/" aria-label="Home">
              <Image src={logo} alt="Indices Logo" className="h-10 w-auto" />
            </Link>
            <div className="hidden md:flex md:gap-x-6">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#testimonials">Testimonials</NavLink>
              <NavLink href="#faq">FAQ</NavLink>
              {accountId && (
                <NavLink href={`/portfolio/${accountId}`} shiny>
                  Portfolio
                </NavLink>
              )}
              <NavLink href="/explore" shiny>
                Explore
              </NavLink>
              <NavLink href="/create" shiny>
                Create
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-x-5 md:gap-x-8">
            {account ? (
              <>
                <div className="flex items-center gap-2">
                  {account.account_id}{' '}
                  <strong>
                    {utils.format.formatNearAmount(account.amount, 2)}
                  </strong>{' '}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="NEAR Logo"
                    src="https://cryptologos.cc/logos/near-protocol-near-logo.png?v=023"
                    className="h-4"
                  />
                </div>
                <Button onClick={handleSignOut} color="blue">
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => handleSignIn()} color="blue">
                <span>
                  Login <span className="hidden lg:inline">with NEAR</span>
                </span>
              </Button>
            )}
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}

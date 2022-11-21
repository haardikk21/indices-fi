import { Popover } from '@headlessui/react'
import clsx from 'clsx'
import Link from 'next/link'
import { ReactNode } from 'react'

type INavLinkProps = {
  href: string
  shiny?: boolean
  children: ReactNode
}

export const NavLink: React.FC<INavLinkProps> = ({
  href,
  shiny = false,
  children,
}) => {
  return (
    <Link
      href={href}
      className={clsx(
        shiny &&
          'hover:text-slate-20 bg-blue-600 text-slate-50 hover:bg-blue-500',
        !shiny && 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        'inline-block rounded-lg py-1 px-2 text-sm  '
      )}
    >
      {children}
    </Link>
  )
}

export const MobileNavLink: React.FC<INavLinkProps> = ({ href, children }) => {
  return (
    <Popover.Button as={Link} href={href} className="block w-full p-2">
      {children}
    </Popover.Button>
  )
}

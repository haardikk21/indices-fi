import { Layout } from '@/components/Layout'
import { WalletSelectorContextProvider } from '@/contexts/WalletSelectorContext'
import '@near-wallet-selector/modal-ui/styles.css'
import 'react-toastify/dist/ReactToastify.css'
import '@/styles/globals.css'
import 'focus-visible'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { INDICES_CONTRACT_ID, MANAGER_CONTRACT_ID } from '@/constants'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  if (!router) return null

  return (
    <>
      <WalletSelectorContextProvider
        contractId={
          router.pathname === '/create'
            ? MANAGER_CONTRACT_ID
            : INDICES_CONTRACT_ID
        }
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WalletSelectorContextProvider>
    </>
  )
}

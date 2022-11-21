import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { WalletSelectorContextProvider } from '@/contexts/WalletSelectorContext'
import Head from 'next/head'
import { ReactNode } from 'react'
import { ToastContainer } from 'react-toastify'

type ILayoutProps = {
  children: ReactNode
}

export const Layout: React.FC<ILayoutProps> = ({ children }) => {
  return (
    <>
      <Head>
        <title>Indices Finance - Investing made simple</title>
        <meta
          name="description"
          content="Most index funds outperform managed funds over the long run. Indices makes it easy to create, invest, and trade crypto index funds!"
        />
      </Head>

      <div className="min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* Same as */}
      <ToastContainer />
    </>
  )
}

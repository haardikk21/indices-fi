import { IndexTokenCard } from '@/components/IndexTokenCard'
import {
  getIndexTokensAndMetadata,
  getUnderlyingTokenPricesForTokens,
} from '@/utils/viewMethods'
import { FungibleTokenMetadata } from 'interfaces'
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'

type SSRProps = {
  tokens: string[]
  metadata: FungibleTokenMetadata[]
  tokenPrices: {
    token: string
    price: string
  }[][]
}

export const getServerSideProps: GetServerSideProps<SSRProps> = async () => {
  const { tokens, metadata } = await getIndexTokensAndMetadata()
  const tokenPrices = await getUnderlyingTokenPricesForTokens(tokens)

  return {
    props: {
      tokens,
      metadata,
      tokenPrices,
    },
  }
}

const ExplorePage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ tokens, metadata, tokenPrices }) => {
  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col justify-center py-12 sm:px-6 lg:px-8">
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Explore Indices
      </h2>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {tokens.map((_, i) => (
          <IndexTokenCard
            key={i}
            token={tokens[i]}
            metadata={metadata[i]}
            tokenPrices={tokenPrices[i]}
          />
        ))}
      </ul>
    </div>
  )
}

export default ExplorePage

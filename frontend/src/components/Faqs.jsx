import Image from 'next/image'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-faqs.jpg'

const faqs = [
  [
    {
      question: 'What is Indices Finance?',
      answer:
        'Indices is a decentralized asset management protocol that lets you create, invest in, and trade index tokens.',
    },
    {
      question: 'What are index tokens used for?',
      answer:
        'Index tokens can be used as a simplified way to invest in a variety of tokens, through thematic exposure like DeFi or GameFi or NFTs. Choose a market segment you are bullish on, and buy an index token instead of trying to manage your own portfolio constantly.',
    },
    {
      question: 'What happens if I lose money?',
      answer:
        'Indices Finance is a decentralized protocol where anyone can create and invest in index tokens. We are not responsible for any losses incurred due to investing in index tokens which did not perform well.',
    },
  ],
  [
    {
      question: 'What is an index?',
      answer: 'In TradFi, an index is a portfolio of investment holdings, typically containing stocks, that represent a segment of the overall market.',
    },
    {
      question:
        'Who creates these index tokens?',
      answer:
        'Indices allows anyone to create and share their own index tokens. Use this to share your trading strategies with others, and optionally charge a performance fee.',
    },
    {
      question:
        'Why should I be investing in index tokens?',
      answer:
        'Over the last five years, index funds have outperformed managed funds by 82%. It is a neutral way to invest in market segments you are bullish on without needing to pick and choose specific stocks/tokens.',
    },
  ],
  [
    {
      question: 'What is an index token?',
      answer:
        'Index tokens on Indices refer to tokens that contain within them a portfolio of other assets.',
    },
    
    {
      question: 'How can I create my own index token?',
      answer: 'Currently, the only way to create your own index token is through our website UI. In the future, we will provide a developer SDK to do this programatically.',
    },
    {
      question: 'Can I also invest in index stocks like the S&P 500 through this?',
      answer:
        'Using synthetic tokens that represent real-world assets, it is possible to create a digitized S&P 500 index fund. If that is done, then yes you can invest in it through Indices.',
    },
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <Image
        className="absolute top-0 left-1/2 max-w-none translate-x-[-30%] -translate-y-1/4"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            If you can&apos;t find what you&apos;re looking for, email our support team
            and someone will get back to you.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg leading-7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

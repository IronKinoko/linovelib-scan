import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import axios from 'axios'
axios.defaults.baseURL = process.env.basePath

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>linovelib-scan app</title>
        <meta name="description" content="download linovelib as epub" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SWRConfig
        value={{
          fetcher: (resource) => axios.get(resource).then((res) => res.data),
        }}
      >
        <Component {...pageProps} />
      </SWRConfig>
    </>
  )
}

export default MyApp

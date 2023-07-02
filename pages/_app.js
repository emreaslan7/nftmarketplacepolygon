import '../styles/globals.css'
dotenv.config();
import Link from 'next/link'
import dotenv from 'dotenv';

import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { localhost, polygonMumbai } from 'wagmi/chains'
import { Web3Button } from '@web3modal/react'


const projectId =process.env.NEXT_PUBLIC_PROJECT_ID;
console.log(projectId);
const chains = [polygonMumbai, localhost];

const { publicClient } = configureChains(chains, [w3mProvider({projectId})])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)


function MyApp({ Component, pageProps }) {


  return (
    <>
    <WagmiConfig config={wagmiConfig}>
    <div>
      <nav className="border-b p-6 flex items-center justify-between">
        <Link href='/'>
          <p className="text-4xl font-bold">Metaverse Marketplace</p>
        </Link>
        
        <div className="flex items-center">
          {/* <Link href="/">
            <p className="mr-4 text-pink-500">
              Home
            </p>
          </Link> */}
          <Link href="/create-item">
            <p className="mr-6 text-pink-500 hover:underline">
              Create NFT and List
            </p>
          </Link>
          <Link href="/my-assets">
            <p className="mr-6 text-pink-500 hover:underline">
              Creator Dashboard
            </p>
          </Link>
          <Link href="/creator-dashboard">
            <p className="mr-6 text-pink-500 hover:underline">
              Profile
            </p>
          </Link>
          <Web3Button icon='hide' className='mb-3'/>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
    </WagmiConfig>

    <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />

    </>

  )
}

export default MyApp
import '../styles/globals.css'
dotenv.config();
import Link from 'next/link'
import dotenv from 'dotenv';

import { useState, useEffect, useRef } from 'react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { localhost, polygonMumbai } from 'wagmi/chains'
import { Web3Button } from '@web3modal/react'
import Image from 'next/image';


const projectId =process.env.NEXT_PUBLIC_PROJECT_ID;
const chains = [polygonMumbai, localhost];

const { publicClient } = configureChains(chains, [w3mProvider({projectId})])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)


function MyApp({ Component, pageProps }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);


  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  return (
    <>
    <WagmiConfig config={wagmiConfig}>
    <div>
    

<div className="relative">
      <div className="border-b p-6 flex items-center justify-between fixed bg-black w-full">
        <Link href='/'>
          
          <Image src={'/logo_white.png'} width={'300'} height={'90'} alt='logo'/>
        </Link>

        <div className="flex items-center ml-8">
          <button
            className="mr-4 text-pink-500 focus:outline-none lg:hidden"
            onClick={toggleMenu}
          >
  <div className="space-y-2">
    <div className="w-8 h-1 bg-gray-600 rounded"></div>
    <div className="w-8 h-1 bg-gray-600 rounded"></div>
    <div className="w-8 h-1 bg-gray-600 rounded"></div>
</div>
          </button>
          <div className="items-center hidden lg:flex">
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
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 bg-black z-10 flex items-center flex-col justify-between">
          <div className="flex flex-col items-center py-4 space-y-20 mt-12">
            {/* Menü öğeleri */}
            <Link href="/create-item" onClick={toggleMenu}>
              <p className=" text-pink-500 hover:underline font-extrabold text-lg">
                Create NFT and List
              </p>
            </Link>
            <Link href="/my-assets" onClick={toggleMenu}>
              <p className=" text-pink-500 hover:underline font-extrabold text-lg">
                Creator Dashboard
              </p>
            </Link>
            <Link href="/creator-dashboard" onClick={toggleMenu}>
              <p className=" text-pink-500 hover:underline font-extrabold text-lg">
                Profile
              </p>
            </Link>
            <Web3Button icon='hide' className='my-2' onClick={closeMenu} />
          </div>
          <div className='mb-20'>
            <button className=" text-pink-500 focus:outline-none lg:hidden"
            onClick={toggleMenu}>
              <svg className="h-10 w-10 text-pink-500"  viewBox="0 0 24 24"  fill="none"  
              stroke="currentColor"  >
              <line x1="18" y1="6" x2="6" y2="18" />  <line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>


      
      <Component {...pageProps} />
      
    </div>
    </WagmiConfig>

    <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />

    </>

  )
}

export default MyApp
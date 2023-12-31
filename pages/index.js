import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { Inter } from 'next/font/google'

import { nftaddress, nftmarketaddress } from '@/config';

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarketplace.json";
import Image from 'next/image';
require('dotenv').config();


const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [nfts , setNfts] = useState([]);
  const [loadingState , setLoadingState] = useState('non-loading');

  useEffect(() =>{
    loadNFTs();
  },[]);

  async function loadNFTs() {
    // const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);
    const provider = new ethers.providers.JsonRpcProvider('https://matic-mumbai.chainstacklabs.com');
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
    const MarketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, provider);

    const data = await MarketContract.fetchMarketItems();
    console.log(data);
    const items = await Promise.all(data.map(async i => {
      console.log("i : ",i.tokenId.toString());
      const tokenUri = await tokenContract.tokenURI(i.tokenId.toString());
      console.log("tokenUri : ",tokenUri);
      const meta = await axios.get(tokenUri)
      console.log("meta: ",meta);

      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items);
    setLoadingState('loaded');
  }

  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    const transaction = await contract.createMarketSale(nftaddress,nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }



  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  )

  return (
    <div className="flex justify-center">
      <div className="px-4 mt-32" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image alt='caption' height={'350'} width={'500'} src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">{nft.price} MATIC</p>
                  <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import { nftaddress ,nftmarketaddress } from '@/config';
import NFT from '@/artifacts/contracts/NFT.sol/NFT.json';
import Market from '@/artifacts/contracts/NFTMarket.sol/NFTMarketplace.json';

export default function MyAssets(){
    const [nfts , setNfts] = useState([]);
    const [loadingState , setLoadingState] = useState('non-loaded');
    useEffect(() =>{
        loadNfts();
    },[]);

    console.log("nfts: : :  ",nfts)
    // loadNFTs fonksiyonu sadece satın alınan itemleri döndürür
    // listenen nftleri göstermez....
    async function loadNfts(){
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
        const data = await marketContract.fetchItemsCreated();
        console.log("data: ",data);
        const items = await Promise.all(data.map(async i=>{
            console.log("i: ",i)

            const tokenUri = await tokenContract.tokenURI(i.tokenId.toString());
            const meta = await axios.get(tokenUri);
            let price = ethers.utils.formatUnits(i.price.toString(),'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller : i.seller,
                owner : i.owner,
                image : meta.data.image,
                name : meta.data.name,
                description : meta.data.description
            }
            return item;
        }));
        setNfts(items);
        setLoadingState('loaded');
    }

    if( loadingState === 'loaded' && !nfts.length) return (
        <h1 className="py-10 px-20 text-3xl">No NFTs owned</h1>
    )

    return (
        <div className='flex justify-center'>
            <div className='p-4'>
                <h1 className='text-center text-4xl mt-2 font-extralight'>Created for Art, with Love, from You 💕</h1>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
                {
                nfts.map((nft, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <img src={nft.image} className="rounded" />
                        <div className="p-4 bg-black">
                        <h2 className='text-2xl font-extrabold text-pink-500 mt-3'>{nft.name}</h2>
                        <p className="text-md text-white mt-2">{nft.description}</p>
                        {/* <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => listNFT(nft)}>List</button> */}
                        </div>
                    </div>
                ))
                }
                </div>
            </div>
        </div>
    )
}
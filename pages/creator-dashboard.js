import { ethers } from 'ethers'
import { useEffect, useState,useRef } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import { nftaddress ,nftmarketaddress } from '@/config';
import NFT from '@/artifacts/contracts/NFT.sol/NFT.json';
import Market from '@/artifacts/contracts/NFTMarket.sol/NFTMarketplace.json';

export default function CreatorDashboard(){
    const [notListedNFTs, setNotListedNFTs] = useState([]);
    const [nfts , setNfts] = useState([]);
    const [purchasedNFTs , setPurchasedNFTs] = useState([]);

    const [loadingState , setLoadingState] = useState('not-loaded');

    const inputRef = useRef(null);


    useEffect(() =>{
        loadNfts();
    },[]);

    async function loadNfts(){
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
        const userAddress = await signer.getAddress();

        const fetchUserListedNFTsData = await marketContract.fetchUserListedNFTs(userAddress);
        const fetchUserListedNFTsItems = await Promise.all(fetchUserListedNFTsData.map(async i=>{
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
        setNfts(fetchUserListedNFTsItems);

        const fetchPurchasedNFTsData = await marketContract.fetchMyNFTs();
        const fetchPurchasedNFTsItems = await Promise.all(fetchPurchasedNFTsData.map(async i=>{
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
        setPurchasedNFTs(fetchPurchasedNFTsItems);


        const data = await marketContract.fetchOwnedItems(userAddress);
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
                description : meta.data.description,
                isForSale : i.isForSale
            }
            return item;
        }));
        setNotListedNFTs(items);

        setLoadingState('loaded');
  }

  async function cancelList(nft) {
      /* needs the user to sign the transaction, so will use Web3Provider and sign it */
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
  
      const transaction = await contract.deleteMarketSale(nftaddress,nft.tokenId);
      await transaction.wait()

      loadNfts();
  }

  async function createListNFT(nft, salePrice) {
    console.log("salePrice: ", salePrice);
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const contractNFT = new ethers.Contract(nftaddress, NFT.abi, signer)

    let ownerThisNFT = await contractNFT.ownerOf(nft.tokenId);
    console.log("ownerTHisNFT:", ownerThisNFT);

    console.log("typeof nft.tokenId", typeof(nft.tokenId));

    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();

    console.log("salePrice", salePrice);
    const price = ethers.utils.parseEther(salePrice, 'ether')
    console.log("price", price);
    const transaction = await contract.createMarketItem(nftaddress,nft.tokenId,price, { value: listingPrice})
    await transaction.wait();
    loadNfts();
  }

    console.log("notlistednft",notListedNFTs)
    // if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No NFTs listed</h1>)
    return (
      <div className='pb-20'>
        <div className="p-4">
          <h2 className="text-2xl py-2 underline">Listed Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nfts.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={nft.image} className="rounded" />
                  <div className="p-4 bg-black">
                    <div className='flex justify-between'>
                      <h2 className='text-2xl font-extrabold text-pink-500'>{nft.name}</h2>
                      <p className="text-2xl text-white">{nft.price} ETH</p>
                    </div>
                    <p className='text-md mt-3'>{nft.description}</p>
                    <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => cancelList(nft)}>Cancel Listing</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="px-4">
          {
            // purchasedNFTs &&(
              <div>
                <h2 className="text-2xl py-2 underline">Purchased Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {
                    purchasedNFTs.map((nft,i)=>
                      <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <img src={nft.image} className="rounded" />
                        <div className="p-4 bg-black flex justify-between">
                          <h2 className='text-2xl font-extrabold text-pink-500'>{nft.name}</h2>
                          <p className="text-2xl font-bold text-white">{nft.price} ETH</p>
                        </div>
                      </div>
                    )
                  }
                </div>
              </div>
            // )
  
            
          }
        </div>
        <div className="px-4">
          {
            // purchasedNFTs &&(
              <div>
                <h2 className="text-2xl py-2 underline">Not-Listed Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {
                    notListedNFTs.map((nft,i)=>
                      <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <img src={nft.image} className="rounded" />
                        <div className="p-4 bg-black">
                          <div className=''>
                            <h2 className='text-2xl font-extrabold text-pink-500'>{nft.name}</h2>
                            <p className="text-md text-white mt-2">{nft.description}</p>
                          </div>

                          <div>
                          <div className='flex items-center mt-4'>
                            <p className='whitespace-nowrap mr-3 font-semibold'>Listing Price:</p>
                            <input type='number' ref={inputRef} className='w-full font-bold py-1 rounded text-gray-700 px-4'/>
                          </div>
                          <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => createListNFT(nft,inputRef.current.value)}>Sale</button>
                          </div>

                        </div>
                      </div>
                    )
                  }
                </div>
              </div>
            // )
  
            
          }
        </div>
      </div>
    )

}
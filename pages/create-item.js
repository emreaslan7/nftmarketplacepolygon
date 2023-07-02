// import dotenv from 'dotenv';
// dotenv.config();
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import axios from 'axios'


import { nftaddress ,nftmarketaddress } from '@/config';
import NFT from '@/artifacts/contracts/NFT.sol/NFT.json';
import Market from '@/artifacts/contracts/NFTMarket.sol/NFTMarketplace.json';

export default function CreateItem(){
    const [selectedFile , setSelectedFile] = useState(null);
    console.log("selected File :",selectedFile)
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
    const router = useRouter();

    const changeHandler = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    async function createItem() {
        const JWT = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlYjgzNzdmMy03OWVjLTRlZmUtODlmOC1kNzk0OWFlYjNiNGMiLCJlbWFpbCI6ImVtcmVhc2xhbjdAaWNsb3VkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODI5NzhkOTlmZTEyYTc1YjMyNiIsInNjb3BlZEtleVNlY3JldCI6IjA0ZmEyMTQ2ODY5ZGI5ZTVmZDkzOTA3NmNjYjhiNWRkZDUwYjVmMjAwZjg2YzcwYTE4YmViYmFkOTY0M2Q4MjgiLCJpYXQiOjE2ODc5Njk3MzV9.2aiCg7iKkmVZ8SwqlW-dfCR3mPxqdlTpYsTgpCYiJWw`

        const { name, description, price } = formInput;
 
        const formDataImg = new FormData();
    
        formDataImg.append('file', selectedFile)


        const options = JSON.stringify({
            cidVersion: 0,
        })
        formDataImg.append('pinataOptions', options);
        console.log("Form Data",formDataImg);

        //image'ın ipfs'e yüklenmesi
        let fileUrl;
        try{
            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formDataImg, {
                maxBodyLength: "Infinity",
                headers: {
                'Content-Type': `multipart/form-data; boundary=${formDataImg._boundary}`,
                Authorization: JWT,
                }
            });
            console.log(res);

            if (res.status === 200) {
                const ipfsHash = res.data.IpfsHash;
                fileUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
                console.log("resim url: ", fileUrl);
              } else {
                console.log('Error uploading metadata: ', res.data);
                return null;
            }

        }catch (error) {
        console.log(error);
        }

        // ipfs'e yüklenen image ile birlikte metadatanın ipfs'e yüklenmesi
        let data = JSON.stringify({
            "pinataOptions": {
              "cidVersion": 1
            },
            "pinataMetadata": {
              "name": "testing",
              "keyvalues": {
                "customKey": "customValue",
                "customKey2": "customValue2"
              }
            },
            "pinataContent": {
              "name": name,
              "description" : description,
              "image" : fileUrl,
            }
          });

          let config = {
            method: 'post',
            url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': JWT
            },
            data : data
          };

        try{
            const res2 = await axios(config);

            console.log(res2.data);

            if (res2.status === 200) {
                const ipfsHash = res2.data.IpfsHash;
                const metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
                console.log("işte metadata: ", metadataUrl);
                createSale(metadataUrl);
              } else {
                console.log('Error uploading metadata: ', res2.data);
                return null;
              }

        }catch(error){

        }
    } 
 
      
      

      async function createSale(url) { 
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
    
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        console.log(contract);

        const lastTokenId = await contract._tokenIds();
        console.log("Last tokenId: ", lastTokenId);

        /* create the NFT */
        console.log(contract);
        let transaction = await contract.createToken(url);
        const tx = await transaction.wait();

        console.log("tx: ",tx)
  
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();

        console.log("tokenIdD:", tokenId);
      
        // console.log(somo);

        const price = ethers.utils.parseEther(formInput.price, 'ether');

        const contractMarket = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        console.log("contractMarket : ",contractMarket);
        let listingPrice = await contractMarket.getListingPrice();
        
        listingPrice = listingPrice.toString();
        console.log("listingPrice : ",listingPrice);

        transaction = await contractMarket.createMarketItem(
          nftaddress, tokenId, price, { value: listingPrice}
        )

        await transaction.wait();
    
        router.push('/');
      }


      return (
        <div className="flex justify-center">
          <div className="w-1/2 flex flex-col pb-12  text-gray-800">
            <input 
              placeholder="Asset Name"
              className="mt-8 border rounded p-4"
              onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
            />
            <textarea
              placeholder="Asset Description"
              className="mt-2 border rounded p-4"
              onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
            />
            <input
              placeholder="Asset Price in Eth"
              className="mt-2 border rounded p-4"
              onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
            />
            <input
              type="file"
              name="Asset"
              className="my-4 text-gray-200"
              onChange={changeHandler}
            />
            {
              selectedFile && (
                <img className="rounded mt-4" width="350px" src={URL.createObjectURL(selectedFile)} />
              )
            }
            <button onClick={createItem} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
              Create NFT
            </button>
          </div>
        </div>
      )
}
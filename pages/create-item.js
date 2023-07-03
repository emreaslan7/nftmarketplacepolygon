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
    const [loading, setLoading] = useState("loaded");
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
    const router = useRouter();

    const changeHandler = (event) => {
        setSelectedFile(event.target.files[0]);
    };
    async function createItem() {

        setLoading("loading");

        const JWT = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlYjgzNzdmMy03OWVjLTRlZmUtODlmOC1kNzk0OWFlYjNiNGMiLCJlbWFpbCI6ImVtcmVhc2xhbjdAaWNsb3VkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODI5NzhkOTlmZTEyYTc1YjMyNiIsInNjb3BlZEtleVNlY3JldCI6IjA0ZmEyMTQ2ODY5ZGI5ZTVmZDkzOTA3NmNjYjhiNWRkZDUwYjVmMjAwZjg2YzcwYTE4YmViYmFkOTY0M2Q4MjgiLCJpYXQiOjE2ODc5Njk3MzV9.2aiCg7iKkmVZ8SwqlW-dfCR3mPxqdlTpYsTgpCYiJWw`

        const { name, description, price } = formInput;
        if(name === '' || description === '' || price === ''){
          setLoading("loaded");
          return 
        }
        const formDataImg = new FormData();
    
        formDataImg.append('file', selectedFile)


        const options = JSON.stringify({
            cidVersion: 0,
        })
        formDataImg.append('pinataOptions', options);

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
                await createSale(metadataUrl);
              } else {
                console.log('Error uploading metadata: ', res2.data);
                return null;
              }

        }catch(error){

        }
        setLoading("loaded");
    } 
 
      
      

      async function createSale(url) { 
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
    
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);

        const lastTokenId = await contract._tokenIds();

        /* create the NFT */
        console.log(contract);
        let transaction = await contract.createToken(url);
        const tx = await transaction.wait();

  
        let event = tx.events[0];
        let value = event.args[2];
        let tokenId = value.toNumber();

      
        const price = ethers.utils.parseEther(formInput.price, 'ether');

        const contractMarket = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        let listingPrice = await contractMarket.getListingPrice();
        
        listingPrice = listingPrice.toString();

        transaction = await contractMarket.createMarketItem(
          nftaddress, tokenId, price, { value: listingPrice}
        )

        await transaction.wait();
    
        router.push('/');
      }

      console.log("selected File", selectedFile);

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
              type='number'
            />
            
            <div className="col-span-full mt-4">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-400">
                {selectedFile == null ? "Upload your ART" : "Change Image"}
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-500 px-6 py-10">
                <div className="text-center">
                  {/* <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" /> */}
                  <div className="mt-4 flex text-sm leading-6 text-gray-200">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-pink-700 px-2 font-semibold text-gray-50"
                    >
                      <span>{selectedFile == null ? "Upload a file" : "Change file"}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={changeHandler}/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">PNG, JPG, GIF up to 15MB</p>
                </div>
              </div>
              </div>
            
            
           
            {
              selectedFile && (
                <img className="rounded mt-4" width="350px" src={URL.createObjectURL(selectedFile)} />
              )
            }
            {
              loading == "loaded" ? (
                <button onClick={createItem} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                Create NFT
                </button>
              ) : (
                <button disabled type="button" class="text-white bg-pink-500 hover:bg-pink-700 font-bold rounded shadow-lg p-4 text-center mt-4">
                    <svg aria-hidden="true" role="status" class="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                        Creating Your NFT on Blockchain...
                </button>
              )
            }
          </div>
          
        </div>
      )
}
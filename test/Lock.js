const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("NFTMarket", function () {

  let market, nftcontract, marketAddress, nftcontractAddress, listingPrice, auctionPrice;
  let creatorToken;
  let creatorToken2;
  let creatorToken3;
  let creatorToken4;

  before(async ()=> {
    // deploy stuff

    [owner, creatorToken, creatorToken2, creatorToken3, creatorToken4] = await ethers.getSigners();

    const Market = await ethers.getContractFactory("NFTMarketplace");
    market = await Market.deploy();
    await market.deployed();
    
    marketAddress = market.address;


    const NftContract = await ethers.getContractFactory("NFT");
    nftcontract = await NftContract.deploy(marketAddress);
    await nftcontract.deployed();
    
    nftcontractAddress = nftcontract.address;

    let ListingPrice = await market.getListingPrice();
    listingPrice = ListingPrice.toString();

    auctionPrice = ethers.utils.parseUnits("1", 'ether');
    
  })

  async function advanceTime(seconds) {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  }

  it("should deploy contract and execute market sales", async function () {

    await nftcontract.connect(creatorToken).createToken("https://www.mytokenlocation.com");

    await market.connect(creatorToken).createMarketItem(nftcontractAddress, 1, auctionPrice,0, {value : listingPrice});

    await market.connect(creatorToken2).createMarketSale(nftcontractAddress, 1, {value: auctionPrice});

    let items = await market.fetchMarketItems();

    items = await Promise.all(items.map(async i => {
      const tokenUri = await nftcontract.tokenURI(i.tokenId);
      let item = {
        price : i.price.toString(),
        tokenId : i.tokenId.toString(),
        seller: i.seller,
        owner : i.owner,
        tokenUri
      }
      return item;
    }));

    console.log("items: ", items);

  });


  it("cancel execution of a nft sale", async() => {

    await nftcontract.connect(creatorToken3).createToken("https://www.mytokenlocation2.com");

    await market.connect(creatorToken3).createMarketItem(nftcontractAddress, 2, auctionPrice,0, {value : listingPrice});

    await market.connect(creatorToken3).deleteMarketSale(nftcontractAddress, 2);
    console.log("sale canceled, now again createMarketSale");

    await market.connect(creatorToken3).createMarketItem(nftcontractAddress, 2, auctionPrice,2, {value : listingPrice});

  })

  it("start nft auction and cancel it",async() =>{

    console.log( "creator token4", creatorToken4.address);
    await nftcontract.connect(creatorToken4).createToken("https://www.mytokenlocation3.com");
    
    await market.connect(creatorToken4).startNFTAuction(nftcontractAddress, 3, auctionPrice,100000, {value: listingPrice});
    expect(await nftcontract.ownerOf(3)).to.equal(marketAddress);
    console.log("Success!! ");

    await market.connect(creatorToken4).deleteNFTAuction(1,nftcontractAddress);
    expect(await nftcontract.ownerOf(3)).to.equal(creatorToken4.address);


  })

  it("should start an NFT auction", async function () {
    const tokenId = 1;
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    await nftcontract.connect(creatorToken).createToken("https://www.mytokenlocation.com");
    
    await market
      .connect(creatorToken)
      .startNFTAuction(nftcontractAddress, tokenId, auctionPrice, deadline, { value: listingPrice });

    let items = await market.fetchForAuction();
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nftcontract.tokenURI(i.tokenId);
      let item = {
        tokenId : i.tokenId.toString(),
        seller: i.seller,
        owner : i.owner,
        startingPrice: i.startingPrice.toString(),
        highestBid: i.highestBid.toString(),
        deadline: i.deadline.toString(),
        isForAuction: i.isForAuction,
        tokenUri
      }
      return item;
    }));

    expect(items[0].seller).to.equal(creatorToken.address);
    expect(items[0].isForAuction).to.be.true;

  });



  it("should place a bid on an NFT auction", async function () {
    const tokenId = 1;
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    await nftcontract.connect(creatorToken2).createToken("https://www.mytokenlocation.com");
    console.log("creator token2:",creatorToken2.address);
    await market
      .connect(creatorToken2)
      .startNFTAuction(nftcontractAddress, tokenId, auctionPrice, deadline, { value: listingPrice });

    const itemId = 1;
    const bidAmount = ethers.utils.parseUnits("2", "ether");

    await market.connect(creatorToken3).bid(itemId, { value: bidAmount });

    

    let items = await market.fetchForAuction();
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nftcontract.tokenURI(i.tokenId);
      let item = {
        tokenId : i.tokenId.toString(),
        seller: i.seller,
        owner : i.owner,
        startingPrice: i.startingPrice.toString(),
        highestBid: i.highestBid.toString(),
        deadline: i.deadline.toString(),
        isForAuction: i.isForAuction,
        tokenUri
      }
      return item;
    }));

    expect(items[0].highestBid.toString()).to.equal(bidAmount);
    expect(items[0].owner).to.equal(creatorToken3.address);

  });



  it("should finish an NFT auction", async function () {
    const itemId = 1;

    await advanceTime(7200);
    await market.connect(creatorToken3).finishNFTAuction(itemId);

    let items = await market.fetchForAuction();
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nftcontract.tokenURI(i.tokenId);
      let item = {
        tokenId : i.tokenId.toString(),
        seller: i.seller,
        owner : i.owner,
        startingPrice: i.startingPrice.toString(),
        highestBid: i.highestBid.toString(),
        deadline: i.deadline.toString(),
        isForAuction: i.isForAuction,
        tokenUri
      }
      return item;
    }));
    expect(items[0].isForAuction).to.be.false;

  });
});

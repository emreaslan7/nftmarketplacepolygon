// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;


import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ReentrancyGuard{

    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    Counters.Counter private _itemAuctionIds;

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool isForSale;
    }

    struct ItemForAuction{
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint256 startingPrice;
        uint256 highestBid;
        uint deadline;
        bool isForAuction;
    }

    mapping (uint256 => MarketItem) idToMarketItem;
    mapping(uint => ItemForAuction) public idToItemForAuction;

    event MarketItemCreated(
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool isForSale
    );

    event ItemForAuctionCreated(
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address buyer,
        uint startingPrice,
        uint highestBid,
        uint deadline,
        bool isForAuction
    );

    function getListingPrice() public view returns(uint256){
        return listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint tokenId,
        uint256 price,
        uint256 itemIDs
    ) public payable nonReentrant{
        require(price >= 0, "price must be at least 1 wei");
        require(msg.value == listingPrice, "You must pay listing price");

        uint256 itemId;
        if (itemIDs == 0) {
            _itemIds.increment();
            itemId = _itemIds.current();
        }else{
            itemId = itemIDs;
        }
        console.log("itemId:", itemId);

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            true
        );
        
        payable(owner).transfer(listingPrice);
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            true
        );
    }

    function deleteMarketSale(
        address nftContract,
        uint itemId
    )public nonReentrant{
        require(idToMarketItem[itemId].seller == msg.sender, "You are not allowed to delete");
        require(idToMarketItem[itemId].isForSale == true, "NFT is not for sale");

        uint tokenId = idToMarketItem[itemId].tokenId;
        idToMarketItem[itemId].seller = payable(address(0));
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].isForSale = false;
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    }


    function createMarketSale(
        address nftContract,
        uint itemId
    ) public payable nonReentrant{
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price, "You must pay nft price for buying your choosing nft");
        require(idToMarketItem[itemId].isForSale == true, "NFT is not for sale");
        
        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);

        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].isForSale = false;
        _itemsSold.increment();
        
    }

    function startNFTAuction(
        address nftContract,
        uint tokenId,
        uint256 price,
        uint deadline
    )public payable nonReentrant{
        console.log("NFTAuction TOKENID: ",tokenId);

        require(msg.value == listingPrice, "You must pay listing price");
        IERC721 NFT = IERC721(nftContract);
        console.log("TOKENID ownerof: ",NFT.ownerOf(tokenId));
        require(NFT.ownerOf(tokenId) == msg.sender, "You are not owner of this NFT!");

        payable(owner).transfer(listingPrice);
        NFT.transferFrom(msg.sender, address(this), tokenId);

        _itemAuctionIds.increment();
        uint256 itemIdAuction = _itemAuctionIds.current();
        console.log("itemIdAuction: ", itemIdAuction);
        require(idToItemForAuction[itemIdAuction].isForAuction == false, "This item is already in auction");
        idToItemForAuction[itemIdAuction] = ItemForAuction(itemIdAuction,nftContract,tokenId, payable(msg.sender), payable(address(0)) ,price,0,deadline,true);
    }

    function deleteNFTAuction(uint itemId, address nftContract) public nonReentrant{
        require(idToItemForAuction[itemId].seller == msg.sender,"You are not seller of this item");
        require(idToItemForAuction[itemId].isForAuction == true, "This item is not for auction");
        console.log("seller:",idToItemForAuction[itemId].seller);
        console.log("isForAuction :",idToItemForAuction[itemId].isForAuction);

        uint tokenId = idToItemForAuction[itemId].tokenId;
        IERC721 NFT = IERC721(nftContract);
        NFT.transferFrom(address(this),msg.sender, tokenId);
        idToItemForAuction[itemId] = ItemForAuction(itemId ,nftContract ,tokenId, payable(address(0)), payable(msg.sender), 0 ,0, 0, false);
    }

    function bid(uint itemId) payable public {
        ItemForAuction storage info = idToItemForAuction[itemId];

        require(itemId < _itemAuctionIds.current() + 1);
        require(msg.sender != info.seller, "You are seller");
        require(msg.sender != info.owner, "You have highest bid!");
        require(msg.value >= info.startingPrice, "Wrong Price!");
        require(msg.value > info.highestBid, "Wrong Price!");
        require(info.isForAuction == true, "Cannot buy!");
        require(block.timestamp < info.deadline, "Deadline!");

        // Önceki en yüksek teklif sahibine teklif miktarını iade edin
        if (info.owner != address(0)) {
            payable(info.owner).transfer(info.highestBid);
        }

        // Yeni teklif sahibini kaydedin ve highestBid değerini güncelleyin
        info.owner = payable(msg.sender);
        info.highestBid = msg.value;

        console.log("info.highestBid NEW: ", info.highestBid);
    }


    function finishNFTAuction(uint itemId) public {
        ItemForAuction storage info = idToItemForAuction[itemId];
        require(itemId < _itemAuctionIds.current()+1);
        require(msg.sender == info.owner, "You have highest bid!");
        require(info.isForAuction == true, "Already finished!");
        require(block.timestamp > info.deadline, "Deadline!");
        require(info.owner != info.seller, "There is no bid!");
        IERC721 NFT = IERC721(info.nftContract);
        NFT.transferFrom(address(this), msg.sender, info.tokenId);
        uint256 price = info.highestBid;
        payable(info.seller).transfer(price);
        info.isForAuction = false;
        _itemsSold.increment();
    }

    function fetchForAuction() public view returns (ItemForAuction[] memory) {
      uint itemCount = _itemAuctionIds.current();
      ItemForAuction[] memory items = new ItemForAuction[](itemCount);

      for (uint i = 0; i < itemCount; i++) {
        uint currentId = i + 1;
        ItemForAuction storage currentItem = idToItemForAuction[currentId];
        items[i] = currentItem;
      }

      return items;
    }


    /* Returns all unsold market items */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
      uint itemCount = _itemIds.current();
      uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
      uint currentIndex = 0;

      MarketItem[] memory items = new MarketItem[](unsoldItemCount);
      for (uint i = 0; i < itemCount; i++) {
        if (idToMarketItem[i + 1].owner == address(0)) {
          uint currentId = i + 1;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    /* Returns only items that a user has purchased */
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
      uint totalItemCount = _itemIds.current();
      uint itemCount = 0;
      uint currentIndex = 0;

      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].owner == msg.sender) {
          itemCount += 1;
        }
      }

      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].owner == msg.sender) {
          uint currentId = idToMarketItem[i + 1].itemId;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    /* Returns only items a user has listed */
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
      uint totalItemCount = _itemIds.current();
      uint itemCount = 0;
      uint currentIndex = 0;

      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          itemCount += 1;
        }
      }

      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          uint currentId = i + 1;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

}
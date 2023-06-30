const hre = require("hardhat");

async function main() {
  // const NFTMarketplace  = hre.ethers.getContractFactory("NFTMarketplace");
  // const nftMarketplace  = await NFTMarketplace.deploy();
  // await nftMarketplace.deployed();

  const nftMarketplace = await hre.ethers.deployContract("NFTMarketplace");
  console.log('nftMarket deployed successfully, address: ', nftMarketplace.address);

  const NFT  = await hre.ethers.deployContract("NFT",[nftMarketplace.address]);
  console.log('nFT deployed successfully, address: ', NFT.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

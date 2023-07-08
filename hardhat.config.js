// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require('dotenv').config();


/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
//  unused configuration commented out for now
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
      accounts: [process.env.NEXT_PUBLIC_PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
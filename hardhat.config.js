require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
//require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.4",
  networks: {
    fork: {
      url: "http://127.0.0.1:8545/",
      accounts: [
        "",
      ],
      gas: 6e6,
      gasPrice: 1000000000,
    },
    mumbai: {
      url:
        "",
      accounts: [
        "",
      ],
      gas: 6e6,
      gasPrice: 1000000000,
      timeout: 300000000,
    },
  },
  mocha: {
    timeout: 300000000,
  },
};

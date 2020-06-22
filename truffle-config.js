const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider([process.env.DEVELOPMENT_PRIVATE_KEY, process.env.DEVELOPMENT_PRIVATE_KEY_SECONDARY], "http://localhost:8546"); // Fork mainnet geth instance with compound-finance/ganache-core (Compound's fork fixes a false reentrancy error)
      },
      network_id: 1,
      gasPrice: 1 * (10 ** 9)
    },
    live: {
      provider: function() {
        return new HDWalletProvider([process.env.LIVE_DEPLOYER_PRIVATE_KEY], "https://mainnet.infura.io/v3/" + process.env.LIVE_INFURA_PROJECT_ID);
      },
      network_id: 1,
      gasPrice: 1 * (10 ** 9)
    }
  },
  compilers: {
    solc: {
      version: "^0.5.7",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    live: {
      provider: function() {
        return new HDWalletProvider("C721ABE244F3C55B3CA8F7395F3D1EFE97ED8BED200C235DC2F3FCD9873ACCE3", "https://mainnet.infura.io/v3/c52a3970da0a47978bee0fe7988b67b6")
      },
      network_id: 1,
      gasPrice: 2 * (10 ** 9)
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

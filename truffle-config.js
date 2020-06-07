const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(["DFC9C0CFB07304FAF3F356DF668731F87E58C84A1A56A1D80D680EA29E711E2C", "9103CF74D1C8C6B467051AFA0BDEC59CBE69120ECBF6CEB51E6730820F69B9E3"], "http://localhost:8546");
      },
      network_id: 1,
      gasPrice: 1 * (10 ** 9)
    },
    live: {
      provider: function() {
        return new HDWalletProvider(["DFC9C0CFB07304FAF3F356DF668731F87E58C84A1A56A1D80D680EA29E711E2C", "9103CF74D1C8C6B467051AFA0BDEC59CBE69120ECBF6CEB51E6730820F69B9E3"], "https://mainnet.infura.io/v3/c52a3970da0a47978bee0fe7988b67b6");
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

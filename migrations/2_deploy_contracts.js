require('dotenv').config();

var RariFundController = artifacts.require("./RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");
var RariFundProxy = artifacts.require("./RariFundProxy.sol");
var oldRariFundProxyAbi = require("./abi/RariFundProxy_v1.1.0.json");
var comptrollerAbi = require('./abi/Comptroller.json');
var erc20Abi = require('./abi/ERC20.json');

module.exports = function(deployer, network, accounts) {
  if (["live", "live-fork"].indexOf(network) >= 0) {
    if (!process.env.LIVE_GAS_PRICE) return console.error("LIVE_GAS_PRICE is missing for live deployment");
    if (!process.env.LIVE_FUND_OWNER) return console.error("LIVE_FUND_OWNER is missing for live deployment");
    if (!process.env.LIVE_FUND_REBALANCER) return console.error("LIVE_FUND_REBALANCER is missing for live deployment");
    if (!process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY) return console.error("LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY is missing for live deployment");
  }
  
  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    if (!process.env.UPGRADE_OLD_FUND_PROXY) return console.error("UPGRADE_OLD_FUND_PROXY is missing for upgrade");
    if (!process.env.UPGRADE_FUND_MANAGER) return console.error("UPGRADE_FUND_MANAGER is missing for upgrade");
    if (!process.env.UPGRADE_FUND_OWNER_ADDRESS) return console.error("UPGRADE_FUND_OWNER_ADDRESS is missing for upgrade");
  }
  
  var rariFundController = null;
  var rariFundManager = null;
  var rariFundToken = null;
  var rariFundProxy = null;

  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    // Upgrade from v1.1.0
    var oldRariFundProxy = new web3.eth.Contract(oldRariFundProxyAbi, process.env.UPGRADE_OLD_FUND_PROXY);

    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
    if (["live", "live-fork"].indexOf(network) >= 0) {
      options.gas = 2e6;
      options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    }
    return oldRariFundProxy.methods.setFundManager("0x0000000000000000000000000000000000000000").send(options).then(function() {
      return deployer.deploy(RariFundProxy);
    }).then(function() {
      return RariFundManager.at(process.env.UPGRADE_FUND_MANAGER);
    }).then(function(_rariFundManager) {
      rariFundManager = _rariFundManager;
      return rariFundManager.setFundProxy(RariFundProxy.address, { from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
    }).then(function() {
      return RariFundProxy.deployed();
    }).then(function(_rariFundProxy) {
      rariFundProxy = _rariFundProxy;
      return rariFundProxy.setFundManager(process.env.UPGRADE_FUND_MANAGER);
    }).then(function() {
      return rariFundProxy.setGsnTrustedSigner(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_GSN_TRUSTED_SIGNER : accounts[0]);
    }).then(function() {
      if (["live", "live-fork"].indexOf(network) >= 0) return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
    });
  } else {
    // Normal deployment
    deployer.deploy(RariFundController).then(function() {
      return RariFundController.deployed();
    }).then(function(_rariFundController) {
      rariFundController = _rariFundController;
      return deployer.deploy(RariFundManager);
    }).then(function() {
      return RariFundManager.deployed();
    }).then(function(_rariFundManager) {
      rariFundManager = _rariFundManager;
      return rariFundController.setFundManager(RariFundManager.address);
    }).then(function() {
      return rariFundManager.setFundController(RariFundController.address);
    }).then(function() {
      return deployer.deploy(RariFundToken);
    }).then(function() {
      return RariFundToken.deployed();
    }).then(function(_rariFundToken) {
      rariFundToken = _rariFundToken;
      return rariFundToken.addMinter(RariFundManager.address);
    }).then(function() {
      return rariFundToken.renounceMinter();
    }).then(function() {
      return rariFundManager.setFundToken(RariFundToken.address);
    }).then(function() {
      return rariFundToken.setFundManager(RariFundManager.address);
    }).then(function() {
      return deployer.deploy(RariFundProxy);
    }).then(function() {
      return rariFundManager.setFundProxy(RariFundProxy.address);
    }).then(function() {
      return RariFundProxy.deployed();
    }).then(function(_rariFundProxy) {
      rariFundProxy = _rariFundProxy;
      return rariFundProxy.setFundManager(RariFundManager.address);
    }).then(function() {
      return rariFundProxy.setGsnTrustedSigner(process.env.LIVE_FUND_GSN_TRUSTED_SIGNER);
    }).then(function() {
      return rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(350e18));
    }).then(function() {
      return rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : accounts[0]);
    }).then(function() {
      return rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : accounts[0]);
    }).then(function() {
      return rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : accounts[0]);
    }).then(function() {
      return rariFundManager.setInterestFeeRate(web3.utils.toBN(2e17));
    }).then(function() {
      if (["live", "live-fork"].indexOf(network) >= 0) {
        // Live network: transfer ownership of deployed contracts from the deployer to the owner
        return rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER).then(function() {
          return rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundToken.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
        });
      } else {
        // Development network: set all currencies to accepted
        return rariFundManager.setAcceptedCurrency("DAI", true).then(function() {
          return rariFundManager.setAcceptedCurrency("USDC", true);
        }).then(function() {
          return rariFundManager.setAcceptedCurrency("USDT", true);
        });
      }
    });
  }
};

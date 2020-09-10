/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public APIs (described in `API.md` of the `rari-contracts` package) of the official smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license) benefitting Rari Capital, Inc.
 * Only those with explicit permission from a co-founder of Rari Capital (Jai Bhavnani, Jack Lipstone, or David Lucid) are permitted to study, review, or analyze any part of the source code contained in the `rari-contracts` package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in the `rari-contracts` package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

require('dotenv').config();

var DydxPoolController = artifacts.require("./lib/pools/DydxPoolController.sol");
var CompoundPoolController = artifacts.require("./lib/pools/CompoundPoolController.sol");
var AavePoolController = artifacts.require("./lib/pools/AavePoolController.sol");
var MStablePoolController = artifacts.require("./lib/pools/MStablePoolController.sol");
var ZeroExExchangeController = artifacts.require("./lib/pools/ZeroExExchangeController.sol");
var MStableExchangeController = artifacts.require("./lib/pools/MStableExchangeController.sol");
var RariFundController = artifacts.require("./RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");
var RariFundTokenUpgrader = artifacts.require("./RariFundTokenUpgrader.sol");
var RariFundPriceConsumer = artifacts.require("./RariFundPriceConsumer.sol");
var RariFundProxy = artifacts.require("./RariFundProxy.sol");
var oldRariFundControllerAbi = require("./abi/RariFundController_v1.1.0.json");
var oldRariFundManagerAbi = require("./abi/RariFundManager_v1.1.0.json");
var oldRariFundTokenAbi = require("./abi/RariFundToken_v1.0.0.json");

module.exports = function(deployer, network, accounts) {
  if (["live", "live-fork"].indexOf(network) >= 0) {
    if (!process.env.LIVE_GAS_PRICE) return console.error("LIVE_GAS_PRICE is missing for live deployment");
    if (!process.env.LIVE_FUND_OWNER) return console.error("LIVE_FUND_OWNER is missing for live deployment");
    if (!process.env.LIVE_FUND_REBALANCER) return console.error("LIVE_FUND_REBALANCER is missing for live deployment");
    if (!process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY) return console.error("LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY is missing for live deployment");
  }
  
  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    if (!process.env.UPGRADE_OLD_FUND_CONTROLLER) return console.error("UPGRADE_OLD_FUND_CONTROLLER is missing for upgrade");
    if (!process.env.UPGRADE_OLD_FUND_MANAGER) return console.error("UPGRADE_OLD_FUND_MANAGER is missing for upgrade");
    if (!process.env.UPGRADE_OLD_FUND_PROXY) return console.error("UPGRADE_OLD_FUND_PROXY is missing for upgrade");
    if (!process.env.UPGRADE_OLD_FUND_TOKEN) return console.error("UPGRADE_OLD_FUND_TOKEN is missing for upgrade");
    if (!process.env.UPGRADE_FUND_OWNER_ADDRESS) return console.error("UPGRADE_FUND_OWNER_ADDRESS is missing for upgrade");
    
    if (["live", "live-fork"].indexOf(network) >= 0) {
      if (!process.env.UPGRADE_FUND_OWNER_PRIVATE_KEY) return console.error("UPGRADE_FUND_OWNER_PRIVATE_KEY is missing for live upgrade");
      if (!process.env.UPGRADE_TIMESTAMP_COMP_CLAIMED_AND_EXCHANGED || process.env.UPGRADE_TIMESTAMP_COMP_CLAIMED_AND_EXCHANGED < ((new Date()).getTime() / 1000) - 3600 || process.env.UPGRADE_TIMESTAMP_COMP_CLAIMED_AND_EXCHANGED > (new Date()).getTime() / 1000) return console.error("UPGRADE_TIMESTAMP_COMP_CLAIMED_AND_EXCHANGED is missing, invalid, or out of date for live upgrade");
    }
  }
  
  var rariFundController = null;
  var rariFundManager = null;
  var rariFundToken = null;
  var rariFundTokenUpgrader = null;
  var rariFundProxy = null;

  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    // Upgrade from rari-contracts v1.2.0 (RariFundManager v1.1.0, RariFundManager v1.1.0, and RariFundProxy v1.2.0)
    var oldRariFundController = new web3.eth.Contract(oldRariFundControllerAbi, process.env.UPGRADE_OLD_FUND_CONTROLLER);
    var oldRariFundManager = new web3.eth.Contract(oldRariFundManagerAbi, process.env.UPGRADE_OLD_FUND_MANAGER);
    var oldRariFundToken = new web3.eth.Contract(oldRariFundTokenAbi, process.env.UPGRADE_OLD_FUND_TOKEN);

    deployer.deploy(DydxPoolController).then(function() {
      return deployer.deploy(CompoundPoolController);
    }).then(function() {
      return deployer.deploy(AavePoolController);
    }).then(function() {
      return deployer.deploy(MStablePoolController);
    }).then(function() {
      return deployer.deploy(ZeroExExchangeController);
    }).then(function() {
      return deployer.deploy(MStableExchangeController);
    }).then(function() {
      return deployer.link(DydxPoolController, RariFundController);
    }).then(function() {
      return deployer.link(CompoundPoolController, RariFundController);
    }).then(function() {
      return deployer.link(AavePoolController, RariFundController);
    }).then(function() {
      return deployer.link(MStablePoolController, RariFundController);
    }).then(function() {
      return deployer.link(ZeroExExchangeController, RariFundController);
    }).then(function() {
      return deployer.link(MStableExchangeController, RariFundController);
    }).then(function() {
      return deployer.deploy(RariFundController);
    }).then(function() {
      return RariFundController.deployed();
    }).then(function(_rariFundController) {
      rariFundController = _rariFundController;
      return deployer.deploy(RariFundManager);
    }).then(function() {
      var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
      if (["live", "live-fork"].indexOf(network) >= 0) {
        options.gas = 1e6;
        options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
      }
      return oldRariFundController.methods.disableFund().send(options);
    }).then(function() {
      var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
      if (["live", "live-fork"].indexOf(network) >= 0) {
        options.gas = 1e6;
        options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
      }
      return oldRariFundManager.methods.disableFund().send(options);
    }).then(function() {
      var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS, gas: 5e6 };
      if (["live", "live-fork"].indexOf(network) >= 0) options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
      return oldRariFundManager.methods.setFundController(RariFundController.address).send(options);
    }).then(function() {
      return RariFundManager.deployed();
    }).then(function(_rariFundManager) {
      rariFundManager = _rariFundManager;
      return rariFundManager.authorizeFundManagerDataSource(process.env.UPGRADE_OLD_FUND_MANAGER);
    }).then(function() {
      var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
      if (["live", "live-fork"].indexOf(network) >= 0) {
        options.gas = 5e6;
        options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
      }
      return oldRariFundManager.methods.upgradeFundManager(RariFundManager.address).send(options);
    }).then(function() {
      return rariFundManager.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");
    }).then(async function() {
      return rariFundController.setFundManager(RariFundManager.address);
    }).then(function() {
      return rariFundManager.setFundController(RariFundController.address);
    }).then(function() {
      // Disable transfers on the old fund token
      var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
      if (["live", "live-fork"].indexOf(network) >= 0) {
        options.gas = 1e6;
        options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
      }
      return oldRariFundToken.methods.setFundManager("0x0000000000000000000000000000000000000000").send(options);
    }).then(function() {
      return deployer.deploy(RariFundToken);
    }).then(function() {
      return RariFundToken.deployed();
    }).then(function(_rariFundToken) {
      rariFundToken = _rariFundToken;
      return deployer.deploy(RariFundTokenUpgrader, process.env.UPGRADE_OLD_FUND_TOKEN, RariFundToken.address);
    }).then(function() {
      return RariFundTokenUpgrader.deployed();
    }).then(function(_rariFundTokenUpgrader) {
      rariFundTokenUpgrader = _rariFundTokenUpgrader;
      return rariFundToken.addMinter(RariFundTokenUpgrader.address);
    }).then(async function() {
      // getPastEvents only works on Infura and full nodes (not Ganache)
      if (network == "live") {
        // Get all current RFT holders
        var currentRftHolders = [];

        for (const event of (await oldRariFundToken.getPastEvents("Transfer", { fromBlock: 0 }))) {
          if (event.returnValues.to == "0x0000000000000000000000000000000000000000") continue;
          if (currentRftHolders.indexOf(event.returnValues.to) >= 0) continue;
          if (web3.utils.toBN(await oldRariFundToken.methods.balanceOf(currentRftHolders).call()).isZero()) continue;
          currentRftHolders.push(event.returnValues.to);
        }
      } else {
        currentRftHolders = process.env.DEVELOPMENT_UPGRADE_FUND_TOKEN_HOLDERS.split(",");
      }

      // Upgrade all accounts
      for (var i = 0; i < currentRftHolders.length; i += 100) await rariFundTokenUpgrader.upgrade(currentRftHolders.slice(i, i + 100));

      // Make sure we are finished
      if (!(await rariFundTokenUpgrader.finished())) console.error("RariFundTokenUpgrader claims it is not finished after upgrade.");
      if (!web3.utils.toBN(await oldRariFundToken.methods.totalSupply().call()).eq(await rariFundToken.totalSupply.call())) console.error("New RariFundToken total supply not equal to old RariFundToken total supply.");
    }).then(function() {
      return rariFundToken.addMinter(RariFundManager.address);
    }).then(function() {
      return rariFundToken.renounceMinter();
    }).then(function() {
      return rariFundManager.setFundToken(RariFundToken.address);
    }).then(function() {
      return deployer.deploy(RariFundPriceConsumer);
    }).then(function() {
      return RariFundPriceConsumer.deployed();
    }).then(function(_rariFundPriceConsumer) {
      rariFundPriceConsumer = _rariFundPriceConsumer;
      return rariFundController.setFundPriceConsumer(RariFundPriceConsumer.address);
    }).then(function() {
      return rariFundManager.setFundPriceConsumer(RariFundPriceConsumer.address);
    }).then(function() {
      return rariFundController.setDailyLossRateLimit(["live", "live-fork"].indexOf(network) >= 0 ? web3.utils.toBN(0.02e18) : web3.utils.toBN(0.9e18));
    }).then(function() {
      return rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(350e18));
    }).then(async function() {
      for (const account of ["0xf9c18f2d1ea93e9a36507f238cffc6f0ad7d6eb3", "0xba46695289f0835d73658cb7de23dbf24667e0be", "0x58c1a65f5f39dd1b4fa899455d319422df4399f1"]) await rariFundManager.setIndividualAccountBalanceLimit(account, web3.utils.toBN(2).pow(web3.utils.toBN(255)).sub(web3.utils.toBN(1)));
    }).then(function() {
      return rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return deployer.link(ZeroExExchangeController, RariFundProxy);
    }).then(function() {
      return deployer.link(MStableExchangeController, RariFundProxy);
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
      return rariFundProxy.setGsnTrustedSigner(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_GSN_TRUSTED_SIGNER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      if (["live", "live-fork"].indexOf(network) >= 0) {
        // Live network: transfer ownership of deployed contracts from the deployer to the owner
        return rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER).then(function() {
          return rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundPriceConsumer.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
        });
      } else {
        // Development network: set all currencies to accepted
        return rariFundManager.setAcceptedCurrencies(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"], [true, true, true, true, true, true, true]);
      }
    });
  } else {
    // Normal deployment
    deployer.deploy(DydxPoolController).then(function() {
      return deployer.deploy(CompoundPoolController);
    }).then(function() {
      return deployer.deploy(AavePoolController);
    }).then(function() {
      return deployer.deploy(MStablePoolController);
    }).then(function() {
      return deployer.deploy(ZeroExExchangeController);
    }).then(function() {
      return deployer.deploy(MStableExchangeController);
    }).then(function() {
      return deployer.link(DydxPoolController, RariFundController);
    }).then(function() {
      return deployer.link(CompoundPoolController, RariFundController);
    }).then(function() {
      return deployer.link(AavePoolController, RariFundController);
    }).then(function() {
      return deployer.link(MStablePoolController, RariFundController);
    }).then(function() {
      return deployer.link(ZeroExExchangeController, RariFundController);
    }).then(function() {
      return deployer.link(MStableExchangeController, RariFundController);
    }).then(function() {
      return deployer.deploy(RariFundController);
    }).then(function() {
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
      return deployer.deploy(RariFundPriceConsumer);
    }).then(function() {
      return RariFundPriceConsumer.deployed();
    }).then(function(_rariFundPriceConsumer) {
      rariFundPriceConsumer = _rariFundPriceConsumer;
      return rariFundController.setFundPriceConsumer(RariFundPriceConsumer.address);
    }).then(function() {
      return rariFundManager.setFundPriceConsumer(RariFundPriceConsumer.address);
    }).then(function() {
      return rariFundController.setDailyLossRateLimit(["live", "live-fork"].indexOf(network) >= 0 ? web3.utils.toBN(0.02e18) : web3.utils.toBN(0.9e18));
    }).then(function() {
      return rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(350e18));
    }).then(async function() {
      for (const account of ["0xf9c18f2d1ea93e9a36507f238cffc6f0ad7d6eb3", "0xba46695289f0835d73658cb7de23dbf24667e0be", "0x58c1a65f5f39dd1b4fa899455d319422df4399f1"]) await rariFundManager.setIndividualAccountBalanceLimit(account, web3.utils.toBN(2).pow(web3.utils.toBN(255)).sub(web3.utils.toBN(1)));
    }).then(function() {
      return rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      return rariFundManager.setInterestFeeRate(web3.utils.toBN(0.2e18));
    }).then(function() {
      return deployer.link(ZeroExExchangeController, RariFundProxy);
    }).then(function() {
      return deployer.link(MStableExchangeController, RariFundProxy);
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
      return rariFundProxy.setGsnTrustedSigner(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_GSN_TRUSTED_SIGNER : process.env.DEVELOPMENT_ADDRESS);
    }).then(function() {
      if (["live", "live-fork"].indexOf(network) >= 0) {
        // Live network: transfer ownership of deployed contracts from the deployer to the owner
        return rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER).then(function() {
          return rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundPriceConsumer.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
        });
      } else {
        // Development network: set all currencies to accepted
        return rariFundManager.setAcceptedCurrencies(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"], [true, true, true, true, true, true, true]);
      }
    });
  }
};

/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const { deployProxy, admin } = require('@openzeppelin/truffle-upgrades');
require('dotenv').config();

var DydxPoolController = artifacts.require("./lib/pools/DydxPoolController.sol");
var CompoundPoolController = artifacts.require("./lib/pools/CompoundPoolController.sol");
var AavePoolController = artifacts.require("./lib/pools/AavePoolController.sol");
var MStablePoolController = artifacts.require("./lib/pools/MStablePoolController.sol");
var ZeroExExchangeController = artifacts.require("./lib/exchanges/ZeroExExchangeController.sol");
var MStableExchangeController = artifacts.require("./lib/exchanges/MStableExchangeController.sol");
var RariFundController = artifacts.require("./RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");
var RariFundTokenUpgrader = artifacts.require("./RariFundTokenUpgrader.sol");
var RariFundPriceConsumer = artifacts.require("./RariFundPriceConsumer.sol");
var RariFundProxy = artifacts.require("./RariFundProxy.sol");
var oldRariFundControllerAbi = require("./abi/RariFundController_v1.1.0.json");
var oldRariFundManagerAbi = require("./abi/RariFundManager_v1.1.0.json");
var oldRariFundTokenAbi = require("./abi/RariFundToken_v1.0.0.json");

module.exports = async function(deployer, network, accounts) {
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

    if (network != "live" && !process.env.GANACHE_UPGRADE_FUND_TOKEN_HOLDERS) return console.error("GANACHE_UPGRADE_FUND_TOKEN_HOLDERS is missing for development upgrade");
  }

  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    // Upgrade from v1.2.0 (RariFundManager v1.1.0, RariFundManager v1.1.0, RariFundToken v1.0.0, and RariFundProxy v1.2.0) to v2.0.0
    var oldRariFundController = new web3.eth.Contract(oldRariFundControllerAbi, process.env.UPGRADE_OLD_FUND_CONTROLLER);
    var oldRariFundManager = new web3.eth.Contract(oldRariFundManagerAbi, process.env.UPGRADE_OLD_FUND_MANAGER);
    var oldRariFundToken = new web3.eth.Contract(oldRariFundTokenAbi, process.env.UPGRADE_OLD_FUND_TOKEN);

    // Deploy liquidity pool and currency exchange libraries
    await deployer.deploy(DydxPoolController);
    await deployer.deploy(CompoundPoolController);
    await deployer.deploy(AavePoolController);
    await deployer.deploy(MStablePoolController);
    await deployer.deploy(ZeroExExchangeController);
    await deployer.deploy(MStableExchangeController);

    // Link libraries to RariFundController
    await deployer.link(DydxPoolController, RariFundController);
    await deployer.link(CompoundPoolController, RariFundController);
    await deployer.link(AavePoolController, RariFundController);
    await deployer.link(MStablePoolController, RariFundController);
    await deployer.link(ZeroExExchangeController, RariFundController);
    await deployer.link(MStableExchangeController, RariFundController);

    // Deploy new RariFundController and RariFundManager
    var rariFundController = await deployer.deploy(RariFundController);
    var rariFundManager = await deployProxy(RariFundManager, [], { deployer, unsafeAllowCustomTypes: true });

    // Disable the fund on the old RariFundController and RariFundManager
    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
    if (["live", "live-fork"].indexOf(network) >= 0) {
      options.gas = 1e6;
      options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    }
    await oldRariFundController.methods.disableFund().send(options);

    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
    if (["live", "live-fork"].indexOf(network) >= 0) {
      options.gas = 1e6;
      options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    }
    await oldRariFundManager.methods.disableFund().send(options);

    // Upgrade RariFundController via old RariFundManager
    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS, gas: 5e6 };
    if (["live", "live-fork"].indexOf(network) >= 0) options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    await oldRariFundManager.methods.setFundController(RariFundController.address).send(options);

    // Upgrade RariFundManager
    await rariFundManager.authorizeFundManagerDataSource(process.env.UPGRADE_OLD_FUND_MANAGER);

    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
    if (["live", "live-fork"].indexOf(network) >= 0) {
      options.gas = 5e6;
      options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    }
    await oldRariFundManager.methods.upgradeFundManager(RariFundManager.address).send(options);

    await rariFundManager.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");

    // Connect new RariFundController and RariFundManager
    await rariFundController.setFundManager(RariFundManager.address);
    await rariFundManager.setFundController(RariFundController.address);

    // Set Aave referral code
    await rariFundController.setAaveReferralCode(86);

    // Disable transfers on the old fund token
    var options = { from: process.env.UPGRADE_FUND_OWNER_ADDRESS };
    if (["live", "live-fork"].indexOf(network) >= 0) {
      options.gas = 1e6;
      options.gasPrice = parseInt(process.env.LIVE_GAS_PRICE);
    }
    await oldRariFundToken.methods.setFundManager("0x0000000000000000000000000000000000000000").send(options);

    // Deploy new RariFundToken
    var rariFundToken = await deployProxy(RariFundToken, [], { deployer });

    // Deploy RariFundTokenUpgrader
    var rariFundTokenUpgrader = await deployer.deploy(RariFundTokenUpgrader, process.env.UPGRADE_OLD_FUND_TOKEN, RariFundToken.address);

    // Temporarily add RariFundTokenUpgrader as RariFundToken minter
    await rariFundToken.addMinter(RariFundTokenUpgrader.address);

    // Get all current RFT holders (getPastEvents only works on Infura and full nodes, not Ganache)
    if (network == "live") {
      var currentRftHolders = [];

      for (const event of (await oldRariFundToken.getPastEvents("Transfer", { fromBlock: 0 }))) {
        if (event.returnValues.to == "0x0000000000000000000000000000000000000000") continue;
        if (currentRftHolders.indexOf(event.returnValues.to) >= 0) continue;
        if (web3.utils.toBN(await oldRariFundToken.methods.balanceOf(currentRftHolders).call()).isZero()) continue;
        currentRftHolders.push(event.returnValues.to);
      }
    } else {
      currentRftHolders = process.env.GANACHE_UPGRADE_FUND_TOKEN_HOLDERS.split(",");
    }

    // Upgrade all accounts (renounces minter role afterwards)
    for (var i = 0; i < currentRftHolders.length; i += 100) await rariFundTokenUpgrader.upgrade(currentRftHolders.slice(i, i + 100));

    // Make sure we are finished upgrading
    if (!(await rariFundTokenUpgrader.finished.call())) console.error("RariFundTokenUpgrader claims it is not finished after upgrade.");
    if (!web3.utils.toBN(await oldRariFundToken.methods.totalSupply().call()).eq(await rariFundToken.totalSupply.call())) console.error("New RariFundToken total supply not equal to old RariFundToken total supply.");

    // Add RariFundManager as as RariFundToken minter
    await rariFundToken.addMinter(RariFundManager.address);

    // Connect RariFundToken to RariFundManager
    await rariFundManager.setFundToken(RariFundToken.address);

    // Deploy RariFundPriceConsumer
    var rariFundPriceConsumer = await deployProxy(RariFundPriceConsumer, [], { deployer });

    // Connect RariFundPriceConsumer to RariFundManager
    await rariFundManager.setFundPriceConsumer(RariFundPriceConsumer.address);

    // Set daily loss rate limit for currency exchanges
    await rariFundController.setDailyLossRateLimit(["live", "live-fork"].indexOf(network) >= 0 ? web3.utils.toBN(0.02e18) : web3.utils.toBN(0.9e18));

    // Set maximum default account balance limit
    await rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1));

    // Set fund rebalancer on controller and manager
    await rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    await rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);

    // Set interest fee master beneficiary
    await rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : process.env.DEVELOPMENT_ADDRESS);

    // Link libraries to RariFundProxy
    await deployer.link(ZeroExExchangeController, RariFundProxy);
    await deployer.link(MStableExchangeController, RariFundProxy);

    // Deploy RariFundProxy
    var rariFundProxy = await deployer.deploy(RariFundProxy);

    // Connect RariFundManager and RariFundProxy
    await rariFundManager.setFundProxy(RariFundProxy.address);
    await rariFundProxy.setFundManager(RariFundManager.address);

    // Set GSN trusted signer
    await rariFundProxy.setGsnTrustedSigner(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_GSN_TRUSTED_SIGNER : process.env.DEVELOPMENT_ADDRESS);
    
    if (["live", "live-fork"].indexOf(network) >= 0) {
      // Live network: transfer ownership of deployed contracts from the deployer to the owner
      await rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER);
      await rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
      await rariFundToken.addMinter(process.env.LIVE_FUND_OWNER);
      await rariFundToken.renounceMinter();
      await rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
      await admin.transferProxyAdminOwnership(process.env.LIVE_FUND_OWNER);
    } else {
      // Development network: set all currencies to accepted
      await rariFundManager.setAcceptedCurrencies(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"], [true, true, true, true, true, true, true]);
    }
  } else {
    // Normal deployment!
    // Deploy liquidity pool and currency exchange libraries
    await deployer.deploy(DydxPoolController);
    await deployer.deploy(CompoundPoolController);
    await deployer.deploy(AavePoolController);
    await deployer.deploy(MStablePoolController);
    await deployer.deploy(ZeroExExchangeController);
    await deployer.deploy(MStableExchangeController);

    // Link libraries to RariFundController
    await deployer.link(DydxPoolController, RariFundController);
    await deployer.link(CompoundPoolController, RariFundController);
    await deployer.link(AavePoolController, RariFundController);
    await deployer.link(MStablePoolController, RariFundController);
    await deployer.link(ZeroExExchangeController, RariFundController);
    await deployer.link(MStableExchangeController, RariFundController);

    // Deploy RariFundController and RariFundManager
    var rariFundController = await deployer.deploy(RariFundController);
    var rariFundManager = await deployProxy(RariFundManager, [], { deployer, unsafeAllowCustomTypes: true });

    // Connect RariFundController and RariFundManager
    await rariFundController.setFundManager(RariFundManager.address);
    await rariFundManager.setFundController(RariFundController.address);

    // Set Aave referral code
    await rariFundController.setAaveReferralCode(86);
    
    // Deploy RariFundToken
    var rariFundToken = await deployProxy(RariFundToken, [], { deployer });
    
    // Add RariFundManager as as RariFundToken minter
    await rariFundToken.addMinter(RariFundManager.address);

    // Connect RariFundToken to RariFundManager
    await rariFundManager.setFundToken(RariFundToken.address);

    // Deploy RariFundPriceConsumer
    var rariFundPriceConsumer = await deployProxy(RariFundPriceConsumer, [], { deployer });

    // Connect RariFundPriceConsumer to RariFundManager
    await rariFundManager.setFundPriceConsumer(RariFundPriceConsumer.address);

    // Set daily loss rate limit for currency exchanges
    await rariFundController.setDailyLossRateLimit(["live", "live-fork"].indexOf(network) >= 0 ? web3.utils.toBN(0.02e18) : web3.utils.toBN(0.9e18));

    // Set maximum default account balance limit
    await rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1));

    // Set fund rebalancer on controller and manager
    await rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);
    await rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : process.env.DEVELOPMENT_ADDRESS);

    // Set interest fee master beneficiary
    await rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : process.env.DEVELOPMENT_ADDRESS);

    // Set interest fee rate to 20%
    await rariFundManager.setInterestFeeRate(web3.utils.toBN(0.2e18));

    // Link libraries to RariFundProxy
    await deployer.link(ZeroExExchangeController, RariFundProxy);
    await deployer.link(MStableExchangeController, RariFundProxy);

    // Deploy RariFundProxy
    var rariFundProxy = await deployer.deploy(RariFundProxy);

    // Connect RariFundManager and RariFundProxy
    await rariFundManager.setFundProxy(RariFundProxy.address);
    await rariFundProxy.setFundManager(RariFundManager.address);

    // Set GSN trusted signer
    await rariFundProxy.setGsnTrustedSigner(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_GSN_TRUSTED_SIGNER : process.env.DEVELOPMENT_ADDRESS);

    if (["live", "live-fork"].indexOf(network) >= 0) {
      // Live network: transfer ownership of deployed contracts from the deployer to the owner
      await rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER);
      await rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
      await rariFundToken.addMinter(process.env.LIVE_FUND_OWNER);
      await rariFundToken.renounceMinter();
      await rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
      await admin.transferProxyAdminOwnership(process.env.LIVE_FUND_OWNER);
    } else {
      // Development network: set all currencies to accepted
      await rariFundManager.setAcceptedCurrencies(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"], [true, true, true, true, true, true, true]);
    }
  }
};

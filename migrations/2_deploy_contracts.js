const Web3 = require('web3');
require('dotenv').config();

var RariFundController = artifacts.require("./lib/RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");
var RariFundProxy = artifacts.require("./RariFundProxy.sol");

module.exports = function(deployer, network, accounts) {
  if (network == "live") {
    if (!process.env.LIVE_FUND_OWNER) return console.error("LIVE_FUND_OWNER is missing for live deployment");
    if (!process.env.LIVE_FUND_REBALANCER) return console.error("LIVE_FUND_REBALANCER is missing for live deployment");
    if (!process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY) return console.error("LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY is missing for live deployment");
  }
  
  var rariFundToken = null;
  var rariFundManager = null;

  deployer.deploy(RariFundController).then(function() {
    return deployer.link(RariFundController, RariFundManager);
  }).then(function() {
    return deployer.deploy(RariFundManager);
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
    return RariFundManager.deployed();
  }).then(function(_rariFundManager) {
    rariFundManager = _rariFundManager;
    return rariFundManager.setFundToken(RariFundToken.address);
  }).then(function() {
    return rariFundToken.setFundManager(RariFundManager.address);
  }).then(function() {
    return deployer.deploy(RariFundProxy);
  }).then(function() {
    return rariFundManager.setFundProxy(RariFundProxy.address);
  }).then(function() {
    return RariFundProxy.deployed();
  }).then(function(rariFundProxy) {
    return rariFundProxy.setFundManager(RariFundManager.address);
  }).then(function() {
    return rariFundManager.setDefaultAccountBalanceLimit(Web3.utils.toBN(250 * 1e18));
  }).then(function() {
    return rariFundManager.setFundRebalancer(network == "live" ? process.env.LIVE_FUND_REBALANCER : accounts[0]);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("DAI", true);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("USDC", true);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("USDT", true);
  }).then(function() {
    return rariFundManager.setInterestFeeMasterBeneficiary(network == "live" ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : accounts[0]);
  }).then(function() {
    if (network == "live") return rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER).then(function() {
      return rariFundToken.transferOwnership(process.env.LIVE_FUND_OWNER);
    }).then(function() {
      return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
    });
  });
};

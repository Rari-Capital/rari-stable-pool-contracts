const Web3 = require('web3');

var RariFundController = artifacts.require("./lib/RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");

module.exports = function(deployer, network, accounts) {
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
    return rariFundManager.setAccountBalanceLimitUsd(Web3.utils.toBN(250 * 1e18));
  }).then(function() {
    return rariFundManager.setFundRebalancer(accounts[0]);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("DAI", true);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("USDC", true);
  }).then(function() {
    return rariFundManager.setAcceptedCurrency("USDT", true);
  }).then(function() {
    return rariFundManager.setInterestFeeMasterBeneficiary(accounts[0]);
  });
};

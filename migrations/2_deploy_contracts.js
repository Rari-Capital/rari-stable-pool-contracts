var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");

module.exports = function(deployer) {
  var rariFundToken = null;
  var rariFundManager = null;

  deployer.deploy(RariFundManager).then(function() {
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
    return rariFundManager.setAccountBalanceLimitUsd(250 * 1e18);
  });
};

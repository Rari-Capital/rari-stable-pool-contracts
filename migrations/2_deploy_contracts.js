var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");

module.exports = function(deployer) {
  var rariFundToken = null;

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
  }).then(function(rariFundManager) {
    return rariFundManager.setFundToken(RariFundToken.address);
  });
};

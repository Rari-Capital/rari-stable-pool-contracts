var FarmerFundManager = artifacts.require("./FarmerFundManager.sol");
var FarmerFundToken = artifacts.require("./FarmerFundToken.sol");

module.exports = function(deployer) {
  var farmerFundToken = null;

  deployer.deploy(FarmerFundManager).then(function() {
    return deployer.deploy(FarmerFundToken);
  }).then(function() {
    return FarmerFundToken.deployed();
  }).then(function(_farmerFundToken) {
    farmerFundToken = _farmerFundToken;
    return farmerFundToken.addMinter(FarmerFundManager.address);
  }).then(function() {
    return farmerFundToken.renounceMinter();
  }).then(function() {
    return FarmerFundManager.deployed();
  }).then(function(farmerFundManager) {
    return farmerFundManager.setFundToken(FarmerFundToken.address);
  });
};

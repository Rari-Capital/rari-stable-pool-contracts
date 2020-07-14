require('dotenv').config();

var RariFundController = artifacts.require("./RariFundController.sol");
var RariFundManager = artifacts.require("./RariFundManager.sol");
var RariFundToken = artifacts.require("./RariFundToken.sol");
var RariFundProxy = artifacts.require("./RariFundProxy.sol");
var oldRariFundManagerAbi = require("./abi/RariFundManager_v1.0.0.json");
var comptrollerAbi = require('./abi/Comptroller.json');
var erc20Abi = require('./abi/ERC20.json');

module.exports = function(deployer, network, accounts) {
  if (["live", "live-fork"].indexOf(network) >= 0) {
    if (!process.env.LIVE_FUND_OWNER) return console.error("LIVE_FUND_OWNER is missing for live deployment");
    if (!process.env.LIVE_FUND_REBALANCER) return console.error("LIVE_FUND_REBALANCER is missing for live deployment");
    if (!process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY) return console.error("LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY is missing for live deployment");
  }
  
  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    if (!process.env.UPGRADE_OLD_FUND_MANAGER) return console.error("UPGRADE_OLD_FUND_MANAGER is missing for upgrade");
    if (!process.env.UPGRADE_FUND_TOKEN) return console.error("UPGRADE_FUND_TOKEN is missing for upgrade");
    if (!process.env.UPGRADE_FUND_OWNER_ADDRESS) return console.error("UPGRADE_FUND_OWNER_ADDRESS is missing for upgrade");
  }
  
  var rariFundController = null;
  var rariFundManager = null;
  var rariFundToken = null;
  var rariFundProxy = null;

  if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) {
    // Upgrade from v1.0.0
    var oldRariFundManager = new web3.eth.Contract(oldRariFundManagerAbi, process.env.UPGRADE_OLD_FUND_MANAGER);

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
      return oldRariFundManager.methods.disableFund().send({ from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
    }).then(function() {
      return rariFundManager.authorizeFundManagerDataSource(process.env.UPGRADE_OLD_FUND_MANAGER);
    }).then(function() {
      return oldRariFundManager.methods.upgradeFundManager(RariFundManager.address).send({ from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
    }).then(function() {
      return rariFundManager.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");
    }).then(function() {
      return rariFundManager.forwardToFundController();
    }).then(async function() {
      // Get all past and current RFT holders who might have have nonzero net deposits
      var pastRftHolders = [];

      event_loop: for (const event of await rariFundToken.getPastEvents("Transfer", { fromBlock: 0 })) {
        if (event.returnValues.to == "0x0000000000000000000000000000000000000000") continue;
        for (var i = 0; i < pastRftHolders.length; i++) if (event.returnValues.to == pastRftHolders[i]) continue event_loop;
          pastRftHolders.push(event.returnValues.to);
      }

      // Check their net deposits by subtracting interest accrued from balance
      var netDeposits = [];
      for (var i = 0; i < pastRftHolders.length; i++) netDeposits[i] = web3.utils.toBN(await oldRariFundManager.methods.balanceOf(pastRftHolders[i]).call()).sub(web3.utils.toBN(await oldRariFundManager.methods.interestAccruedBy(pastRftHolders[i]).call()));

      // Initialize net deposits for all accounts
      return rariFundManager.initNetDeposits(pastRftHolders, netDeposits);
    }).then(function() {
      return rariFundManager.setFundToken(process.env.UPGRADE_FUND_TOKEN);
    }).then(function() {
      return RariFundToken.at(process.env.UPGRADE_FUND_TOKEN);
    }).then(function(_rariFundToken) {
      rariFundToken = _rariFundToken;
      return rariFundToken.setFundManager(RariFundManager.address, { from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
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
      return rariFundManager.setDefaultAccountBalanceLimit(web3.utils.toBN(350e18));
    }).then(function() {
      return rariFundController.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : accounts[0]);
    }).then(function() {
      return rariFundManager.setFundRebalancer(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_REBALANCER : accounts[0]);
    }).then(function() {
      return rariFundManager.setInterestFeeMasterBeneficiary(["live", "live-fork"].indexOf(network) >= 0 ? process.env.LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY : accounts[0]);
    }).then(function() {
      if (["live", "live-fork"].indexOf(network) >= 0) {
        // Live network: transfer ownership of deployed contracts from the deployer to the owner
        return rariFundController.transferOwnership(process.env.LIVE_FUND_OWNER).then(function() {
          return rariFundManager.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          return rariFundProxy.transferOwnership(process.env.LIVE_FUND_OWNER);
        }).then(function() {
          // Also transfer ownership of RariFundToken from the old owner to the new owner if the owner has changed
          if (process.env.LIVE_FUND_OWNER !== process.env.UPGRADE_FUND_OWNER_ADDRESS) return rariFundToken.transferOwnership(process.env.LIVE_FUND_OWNER, { from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
        });
      } else {
        // Development network: set all currencies to accepted
        return rariFundManager.setAcceptedCurrency("DAI", true).then(function() {
          return rariFundManager.setAcceptedCurrency("USDC", true);
        }).then(function() {
          return rariFundManager.setAcceptedCurrency("USDT", true);
        });
      }
    }).then(async function() {
      // Claim COMP from the old RariFundManager, withdraw it to the owner, and forward it to the new RariFundManager
      var comptroller = new web3.eth.Contract(comptrollerAbi, "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B");
      await comptroller.methods.claimComp([process.env.UPGRADE_OLD_FUND_MANAGER], ["0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643", "0x39AA39c021dfbaE8faC545936693aC917d5E7563", "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9"], false, true).send({ from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
      var compToken = new web3.eth.Contract(erc20Abi, "0xc00e94Cb662C3520282E6f5717214004A7f26888");
      var compBalanceBN = web3.utils.toBN(await compToken.methods.balanceOf(process.env.UPGRADE_OLD_FUND_MANAGER).call());

      if (compBalanceBN.gt(web3.utils.toBN(0))) {
        await oldRariFundManager.methods.ownerWithdraw("COMP").send({ from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
        await compToken.methods.transfer(RariFundController.address, compBalanceBN.toString()).send({ from: process.env.UPGRADE_FUND_OWNER_ADDRESS });
      }
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

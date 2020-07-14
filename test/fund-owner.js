const fs = require('fs');

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

// To compile DummyRariFundManager, run the following command using solc-js v0.5.17
// solcjs DummyRariFundManager.sol --abi --bin
const dummyRariFundManagerAbi = JSON.parse(fs.readFileSync(__dirname + '/fixtures/DummyRariFundManager_sol_DummyRariFundManager.abi'));
const dummyRariFundManagerBin = fs.readFileSync(__dirname + '/fixtures/DummyRariFundManager_sol_DummyRariFundManager.bin');

// To compile DummyRariFundController, run the following command using solc-js v0.5.17
// solcjs DummyRariFundController.sol --abi --bin
const dummyRariFundControllerAbi = JSON.parse(fs.readFileSync(__dirname + '/fixtures/DummyRariFundController_sol_DummyRariFundController.abi'));
const dummyRariFundControllerBin = fs.readFileSync(__dirname + '/fixtures/DummyRariFundController_sol_DummyRariFundController.bin');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundController, RariFundManager", accounts => {
  it("should upgrade the fund manager owner", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.transferOwnership()
    await fundManagerInstance.transferOwnership(accounts[1], { from: accounts[0] });

    // Test disabling and enabling the fund from the new owner address
    await fundManagerInstance.disableFund({ from: accounts[1] });
    await fundManagerInstance.enableFund({ from: accounts[1] });

    // Transfer ownership back
    await fundManagerInstance.transferOwnership(accounts[0], { from: accounts[1] });
  });

  it("should upgrade the fund controller owner", async () => {
    let fundControllerInstance = await RariFundController.deployed();

    // RariFundManager.transferOwnership()
    await fundControllerInstance.transferOwnership(accounts[1], { from: accounts[0] });

    // Test disabling and enabling the fund from the new owner address
    await fundControllerInstance.disableFund({ from: accounts[1] });
    await fundControllerInstance.enableFund({ from: accounts[1] });

    // Transfer ownership back
    await fundControllerInstance.transferOwnership(accounts[0], { from: accounts[1] });
  });

  it("should disable and re-enable the fund", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());

    // Disable the fund (via RariFundController and RariFundManager)
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)
    
    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));
    
    // Test disabled RariFundManager: make sure we can't deposit or withdraw now (using DAI as an example)
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
  
    try {
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    try {
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }

    // Test disabled RariFundController: make sure we can't approve to pools now (using DAI on dYdX as an example)
    try {
      await fundControllerInstance.approveToPool(0, "DAI", amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund controller contract is disabled. This may be due to an upgrade.");
    }

    // Re-enable the fund (via RariFundManager and RariFundController)
    await fundManagerInstance.enableFund({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundControllerInstance.enableFund({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Test re-enabled RariFundManager: make sure we can deposit and withdraw now (using DAI as an example)
    let myInitialBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostDepositBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myPostDepositBalance.gte(myInitialBalance.add(amountUsdBN)));
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostWithdrawalBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myPostWithdrawalBalance.lt(myPostDepositBalance));

    // Test re-enabled RariFundController: make sure we can approve to pools now (using DAI on dYdX as an example)
    await fundControllerInstance.approveToPool(0, "DAI", amountBN, { from: accounts[0] });
  });

  it("should put upgrade the fund rebalancer", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();

    // Set fund rebalancer addresses
    await fundControllerInstance.setFundRebalancer(accounts[1], { from: accounts[0] });
    await fundManagerInstance.setFundRebalancer(accounts[1], { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundRebalancerAddress (no way to do this as of now)

    // Test fund rebalancer functions from the second account via RariFundManager and RariFundController
    // TODO: Ideally, we actually test the fund rebalancer itself
    await fundManagerInstance.setAcceptedCurrency("DAI", false, { from: accounts[1] });
    await fundManagerInstance.setAcceptedCurrency("DAI", true, { from: accounts[1] });
    await fundControllerInstance.approveToPool(0, "DAI", web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1)), { from: accounts[1] });

    // Reset fund rebalancer addresses
    await fundManagerInstance.setFundRebalancer(accounts[0], { from: accounts[0] });
    await fundControllerInstance.setFundRebalancer(accounts[0], { from: accounts[0] });
  });
});

contract("RariFundManager", accounts => {
  it("should put upgrade the FundManager to a copy of its code by disabling the FundController and old FundManager and passing data to the new FundManager", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundManager
    var newFundManagerInstance = await RariFundManager.new({ from: accounts[0] });
    await newFundManagerInstance.setFundController(RariFundController.address, { from: accounts[0] });
    await newFundManagerInstance.setFundToken(parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? process.env.UPGRADE_FUND_TOKEN : RariFundToken.address, { from: accounts[0] });

    // Upgrade!
    await newFundManagerInstance.authorizeFundManagerDataSource(fundManagerInstance.address);
    await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address);
    await newFundManagerInstance.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");

    // Check balance of new FundManager
    let newRawFundBalance = await newFundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await newFundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await newFundManagerInstance.balanceOf.call(accounts[0]);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundManager", accounts => {
  it("should put upgrade the FundManager to new code by disabling the FundController and old FundManager and passing data to the new FundManager", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundManager
    let newFundManagerWeb3Instance = new web3.eth.Contract(dummyRariFundManagerAbi);
    newFundManagerWeb3Instance = await newFundManagerWeb3Instance.deploy({ data: "0x" + dummyRariFundManagerBin }).send({ from: accounts[0] });

    // Upgrade!
    await newFundManagerWeb3Instance.methods.authorizeFundManagerDataSource(fundManagerInstance.address).send({ from: accounts[0] });
    await fundManagerInstance.upgradeFundManager(newFundManagerWeb3Instance.options.address);
    await newFundManagerWeb3Instance.methods.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000").send({ from: accounts[0] });
  });
});

contract("RariFundController", accounts => {
  it("should put upgrade the FundController to a copy of its code by disabling the old FundController and the FundManager, withdrawing all tokens from all pools, and transferring them to the new FundController", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundController
    var newFundControllerInstance = await RariFundController.new({ from: accounts[0] });
    await newFundControllerInstance.setFundManager(RariFundManager.address, { from: accounts[0] });

    // Upgrade!
    await fundManagerInstance.setFundController(newFundControllerInstance.address, { from: accounts[0] });

    // Check balance of new FundController
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundController", accounts => {
  it("should put upgrade the FundController to new code by disabling the old FundController and the FundManager, withdrawing all tokens from all pools, and transferring them to the new FundController", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Check balance of original FundController
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundController
    let newFundControllerWeb3Instance = new web3.eth.Contract(dummyRariFundControllerAbi);
    newFundControllerWeb3Instance = await newFundControllerWeb3Instance.deploy({ data: "0x" + dummyRariFundControllerBin }).send({ from: accounts[0] });

    // Upgrade!
    await fundManagerInstance.setFundController(newFundControllerWeb3Instance.options.address, { from: accounts[0] });

    // Check balance of new FundController
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundToken", accounts => {
  // Disabled for now as we do not yet have an upgrade function on the token because it will only be necessary on a future upgrade
  /* it("should put upgrade the FundToken", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());

    // Create new FundToken
    // TODO: Test that we can make changes to the code of the new fund token before deploying it and upgrading to it
    var newFundTokenInstance = await RariFundToken.new({ from: accounts[0] });

    // Copy balances from the old to the new FundToken
    // TODO: Actually pull the token holders from somewhere (how do we get an ERC20 token balance list automatically?)
    var tokenHolders = [accounts[0]];
    var tokenBalances = [];

    for (var i = 0; i < tokenHolders.length; i++) {
      var balance = await fundTokenInstance.balanceOf(tokenHolders[i]);
      tokenBalances.push(balance.valueOf());
    }
    
    // TODO: Implement RariFundToken.upgrade(uint256[] memory accounts, uint256[] memory balances)
    fundTokenInstance.upgrade(tokenHolders, tokenBalances);

    // RariFundManager.setFundToken(address newContract)
    await fundManagerInstance.setFundToken(newFundTokenInstance.address, { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundTokenContract (no way to do this as of now)

    // Check balances to make sure they're the same
    for (var i = 0; i < tokenHolders.length; i++) {
      var balance = await newFundTokenInstance.balanceOf.call(tokenHolders[i]);
      assert(tokenBalances[i].eq(balance));
    }
  }); */
});

/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundPriceConsumer = artifacts.require("RariFundPriceConsumer");

const DummyRariFundController = artifacts.require("DummyRariFundController");
const DummyRariFundManager = artifacts.require("DummyRariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundController, RariFundManager", accounts => {
  it("should upgrade the fund manager owner", async () => {
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());

    // RariFundManager.transferOwnership()
    await fundManagerInstance.transferOwnership(process.env.DEVELOPMENT_ADDRESS_SECONDARY, { from: process.env.DEVELOPMENT_ADDRESS });

    // Test disabling and enabling the fund from the new owner address
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
    await fundManagerInstance.setFundDisabled(false, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });

    // Transfer ownership back
    await fundManagerInstance.transferOwnership(process.env.DEVELOPMENT_ADDRESS, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
  });

  it("should upgrade the fund controller owner", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());

    // RariFundManager.transferOwnership()
    await fundControllerInstance.transferOwnership(process.env.DEVELOPMENT_ADDRESS_SECONDARY, { from: process.env.DEVELOPMENT_ADDRESS });

    // Test disabling and enabling the fund from the new owner address
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
    await fundControllerInstance.enableFund({ from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });

    // Transfer ownership back
    await fundControllerInstance.transferOwnership(process.env.DEVELOPMENT_ADDRESS, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
  });

  it("should disable and re-enable the fund", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN_ADDRESS) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundPriceConsumer.at(process.env.UPGRADE_FUND_PRICE_CONSUMER_ADDRESS) : RariFundPriceConsumer.deployed());

    // Disable the fund (via RariFundController and RariFundManager)
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)
    
    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();
    var amountUsdBN = amountBN.mul(currencyPricesInUsd[Object.keys(currencies).indexOf(currencyCode)]).div(web3.utils.toBN(10 ** currencies[currencyCode].decimals));
    
    // Test disabled RariFundManager: make sure we can't deposit or withdraw now (using DAI as an example)
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
  
    try {
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    
    try {
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }

    // Test disabled RariFundController: make sure we can't approve to pools now (using DAI on dYdX as an example)
    try {
      await fundControllerInstance.approveToPool(0, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund controller contract is disabled. This may be due to an upgrade.");
    }

    // Re-enable the fund (via RariFundManager and RariFundController)
    await fundManagerInstance.setFundDisabled(false, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    await fundControllerInstance.enableFund({ from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Test re-enabled RariFundManager: make sure we can deposit and withdraw now (using DAI as an example)
    let myInitialBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    let myPostDepositBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(myPostDepositBalance.gte(myInitialBalance.add(amountUsdBN.mul(web3.utils.toBN(999999)).div(web3.utils.toBN(1000000)))));
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    await fundManagerInstance.withdraw(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    let myPostWithdrawalBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(myPostWithdrawalBalance.lt(myPostDepositBalance));

    // Test re-enabled RariFundController: make sure we can approve to pools now (using DAI on dYdX as an example)
    await fundControllerInstance.approveToPool(0, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
  });

  it("should upgrade the fund rebalancer", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());

    // Set fund rebalancer addresses
    await fundControllerInstance.setFundRebalancer(process.env.DEVELOPMENT_ADDRESS_SECONDARY, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundRebalancer(process.env.DEVELOPMENT_ADDRESS_SECONDARY, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check RariFundManager._rariFundRebalancerAddress (no way to do this as of now)

    // Test fund rebalancer functions from the second account via RariFundManager and RariFundController
    // TODO: Ideally, we actually test the fund rebalancer itself
    await fundManagerInstance.setAcceptedCurrencies(["DAI"], [false], { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
    await fundManagerInstance.setAcceptedCurrencies(["DAI"], [true], { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });
    await fundControllerInstance.approveToPool(0, "DAI", web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1)), { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY });

    // Reset fund rebalancer addresses
    await fundManagerInstance.setFundRebalancer(process.env.DEVELOPMENT_ADDRESS, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundControllerInstance.setFundRebalancer(process.env.DEVELOPMENT_ADDRESS, { from: process.env.DEVELOPMENT_ADDRESS });
  });
});

contract("RariFundManager", accounts => {
  it("should upgrade the FundManager implementation to a copy of its code", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit("DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Upgrade FundManager
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.class_defaults.from = process.env.UPGRADE_FUND_OWNER_ADDRESS;
    var newFundManagerInstance = await upgradeProxy(RariFundManager.address, RariFundManager, { unsafeAllowCustomTypes: true });
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.class_defaults.from = process.env.DEVELOPMENT_ADDRESS;

    // Check balance of new FundManager
    let newRawFundBalance = await newFundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await newFundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await newFundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundManager", accounts => {
  it("should upgrade the proxy and implementation of FundManager to new code", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit("DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Upgrade to new FundManager
    var newFundManagerInstance = await deployProxy(DummyRariFundManager, [], { unsafeAllowCustomTypes: true });

    // Upgrade!
    await newFundManagerInstance.authorizeFundManagerDataSource(fundManagerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });
    await newFundManagerInstance.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000", { from: process.env.DEVELOPMENT_ADDRESS });
  });
});

contract("RariFundController", accounts => {
  it("should upgrade the FundController to a copy of its code", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit("DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundController
    var newFundControllerInstance = await RariFundController.new({ from: process.env.DEVELOPMENT_ADDRESS });
    await newFundControllerInstance.setFundManager(RariFundManager.address, { from: process.env.DEVELOPMENT_ADDRESS });

    // Upgrade!
    await fundControllerInstance.upgradeFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of new FundController
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundController", accounts => {
  it("should upgrade the FundController to new code", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit("DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundControllerInstance.depositToPool(1, "DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of original FundController
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundController
    var newFundControllerInstance = await DummyRariFundController.new({ from: process.env.DEVELOPMENT_ADDRESS });

    // Upgrade!
    await fundControllerInstance.upgradeFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of new FundController
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundToken", accounts => {
  it("should upgrade the FundToken to a copy of its code", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN_ADDRESS) : RariFundToken.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundToken.address = process.env.UPGRADE_FUND_TOKEN_ADDRESS;

    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit("DAI", amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    var oldRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);

    // Disable FundController and original FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Upgrade FundToken
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundToken.class_defaults.from = process.env.UPGRADE_FUND_OWNER_ADDRESS;
    var newFundTokenInstance = await upgradeProxy(RariFundToken.address, RariFundToken);
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundToken.class_defaults.from = process.env.DEVELOPMENT_ADDRESS;

    // Check balances
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(newAccountBalance.gte(oldAccountBalance));
    let newRftBalance = await newFundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(newRftBalance.eq(oldRftBalance));
  });
});

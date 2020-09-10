/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public APIs (described in `API.md` of the `rari-contracts` package) of the official smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license) benefitting Rari Capital, Inc.
 * Only those with explicit permission from a co-founder of Rari Capital (Jai Bhavnani, Jack Lipstone, or David Lucid) are permitted to study, review, or analyze any part of the source code contained in the `rari-contracts` package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in the `rari-contracts` package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundPriceConsumer = artifacts.require("RariFundPriceConsumer");

// The owner of RariFundManager should be set to process.env.DEVELOPMENT_ADDRESS, and process.env.DEVELOPMENT_ADDRESS_SECONDARY should own at least a couple dollars in DAI
contract("RariFundManager", accounts => {
  it("should make deposits until the default (global) account balance limit is hit", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await RariFundPriceConsumer.deployed();

    // Get RFT balance and transfer all of it out before we start
    let rftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    if (rftBalance.gt(web3.utils.toBN(0))) await fundTokenInstance.transfer(process.env.DEVELOPMENT_ADDRESS, rftBalance, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });
    var accountBalance = web3.utils.toBN(0);

    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(1e18);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });

    // Keep depositing until we hit the limit (if we pass the limit, fail)
    while (accountBalance.lte(defaultAccountBalanceLimitUsdBN)) {
      try {
        await fundManagerInstance.deposit("DAI", depositAmountBN, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });
      } catch (error) {
        assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
        var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();
        var depositAmountUsdBN = depositAmountBN.mul(currencyPricesInUsd[0]).div(web3.utils.toBN(1e18));
        assert(accountBalance.add(depositAmountUsdBN).gt(defaultAccountBalanceLimitUsdBN));
        return;
      }
      
      accountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    }

    assert.fail();
  });
});

contract("RariFundManager", accounts => {
  it("should make deposits until the individual account balance limit is hit", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await RariFundPriceConsumer.deployed();

    // Get RFT balance and transfer all of it out before we start
    let rftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    if (rftBalance.gt(web3.utils.toBN(0))) await fundTokenInstance.transfer(process.env.DEVELOPMENT_ADDRESS, rftBalance, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });
    var accountBalance = web3.utils.toBN(0);

    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(5e17);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    
    // Set individual account balance limit
    var individualAccountBalanceLimitUsdBN = web3.utils.toBN(1e18);
    await fundManagerInstance.setIndividualAccountBalanceLimit(process.env.DEVELOPMENT_ADDRESS_SECONDARY, individualAccountBalanceLimitUsdBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });

    // Keep depositing until we hit the limit (if we pass the limit, fail)
    while (accountBalance.lte(individualAccountBalanceLimitUsdBN)) {
      try {
        await fundManagerInstance.deposit("DAI", depositAmountBN, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });
      } catch (error) {
        assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
        var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();
        var depositAmountUsdBN = depositAmountBN.mul(currencyPricesInUsd[0]).div(web3.utils.toBN(1e18));
        assert(accountBalance.add(depositAmountUsdBN).gt(individualAccountBalanceLimitUsdBN));
        return;
      }
      
      accountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    }

    assert.fail();
  });
});

contract("RariFundManager", accounts => {
  it("should make no deposits due to an individual account balance limit of 0", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());

    // Get RFT balance and transfer all of it out before we start
    let rftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    if (rftBalance.gt(web3.utils.toBN(0))) await fundTokenInstance.transfer(process.env.DEVELOPMENT_ADDRESS, rftBalance, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });

    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(5e17);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    
    // To set individual account balance limit of 0, use -1 instead (0 means use default limit)
    await fundManagerInstance.setIndividualAccountBalanceLimit(process.env.DEVELOPMENT_ADDRESS_SECONDARY, web3.utils.toBN(-1), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });

    // Try to deposit
    try {
      await fundManagerInstance.deposit("DAI", depositAmountBN, { from: process.env.DEVELOPMENT_ADDRESS_SECONDARY, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS_SECONDARY) });
    } catch (error) {
      assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
      return;
    }

    assert.fail();
  });
});

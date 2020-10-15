/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundController", accounts => {
  it("should upgrade the FundController with funds in all pools in all currencies without using too much gas", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // Tally up fund deposits by currency so we deposit 0.1 tokens of each currency to each pool
    var depositsByCurrency = {};
    
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      depositsByCurrency[currencyCode] ? depositsByCurrency[currencyCode].iadd(amountBN) : depositsByCurrency[currencyCode] = amountBN;
    }

    // For each currency, check initial raw currency balance and approve and deposit to fund
    var rawFundBalancesByCurrency = {};

    for (const currencyCode of Object.keys(depositsByCurrency)) {
      rawFundBalancesByCurrency[currencyCode] = await fundManagerInstance.methods["getRawFundBalance(string)"].call(currencyCode);
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, depositsByCurrency[currencyCode].toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
      await fundManagerInstance.deposit(currencyCode, depositsByCurrency[currencyCode], { from: process.env.DEVELOPMENT_ADDRESS });
    }

    // Approve and deposit 0.1 tokens of each currency to each pool
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      await fundControllerInstance.approveToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      await fundControllerInstance.depositToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
    }

    // Disable original FundController and FundManager
    await fundControllerInstance.disableFund({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.setFundDisabled(true, { from: process.env.DEVELOPMENT_ADDRESS });

    // Create new FundController and set its FundManager
    var newFundControllerInstance = await RariFundController.new({ from: process.env.DEVELOPMENT_ADDRESS });
    await newFundControllerInstance.setFundManager(RariFundManager.address, { from: process.env.DEVELOPMENT_ADDRESS });

    // Upgrade!
    var result = await fundControllerInstance.upgradeFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });
    console.log("Gas usage of RariFundController.upgradeFundController:", result.receipt.gasUsed);
    assert.isAtMost(result.receipt.gasUsed, 5000000); // Assert it uses no more than 5 million gas

    // Set FundController of FundManager to the new FundController
    await fundManagerInstance.setFundController(newFundControllerInstance.address, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check token balances of new FundController
    for (const currencyCode of Object.keys(depositsByCurrency)) {
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      let newRawFundBalance = await fundManagerInstance.methods["getRawFundBalance(string)"].call(currencyCode);
      assert(newRawFundBalance.gte(rawFundBalancesByCurrency[currencyCode].add(depositsByCurrency[currencyCode].mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
      let newFundControllerContractBalance = web3.utils.toBN(await erc20Contract.methods.balanceOf(newFundControllerInstance.address).call());
      assert(newFundControllerContractBalance.gte(rawFundBalancesByCurrency[currencyCode].add(depositsByCurrency[currencyCode].mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
    }
  });
});

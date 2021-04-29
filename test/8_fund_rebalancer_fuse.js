/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/fuse.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundController, RariFundManager", accounts => {
  it("should deposit to the fund, approve deposits to Fuse pools via RariFundController.approveToPool, and deposit to Fuse pools via RariFundController.depositToPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // For each currency of each pool:
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // Approve and deposit tokens to RariFundManager
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check initial pool balance
      var initialBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(100 + Object.keys(pools).indexOf(poolName), currencyCode);

      // Approve and deposit to pool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.approveToPool(100 + Object.keys(pools).indexOf(poolName), currencyCode, poolName === "mStable" ? web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1) : amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      await fundControllerInstance.depositToPool(100 + Object.keys(pools).indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      // Accounting for dYdX and Compound losing some dust using amountBN.mul(9999).div(10000)
      var postDepositBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(100 + Object.keys(pools).indexOf(poolName), currencyCode);
      assert(postDepositBalanceOfUnderlying.gte(initialBalanceOfUnderlying.add(amountBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
    }
  });

  it("should withdraw half from all Fuse pools via RariFundController.withdrawFromPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();

    // For each currency of each pool:
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // Check initial pool balance
      var oldBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(100 + Object.keys(pools).indexOf(poolName), currencyCode);
      
      // Calculate amount to deposit to & withdraw from the pool
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));

      // RariFundController.withdrawFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawFromPool(100 + Object.keys(pools).indexOf(poolName), currencyCode, amountBN.div(web3.utils.toBN(2)), { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      var newBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(100 + Object.keys(pools).indexOf(poolName), currencyCode);
      assert(newBalanceOfUnderlying.lt(oldBalanceOfUnderlying));
    }
  });

  it("should withdraw everything from all Fuse pools via RariFundController.withdrawAllFromPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    
    // For each currency of each pool:
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // RariFundController.withdrawAllFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawAllFromPool(100 + Object.keys(pools).indexOf(poolName), currencyCode, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      var newBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(100 + Object.keys(pools).indexOf(poolName), currencyCode);
      assert(newBalanceOfUnderlying.isZero());
    }
  });
});

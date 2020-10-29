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
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundPriceConsumer = artifacts.require("RariFundPriceConsumer");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundManager, RariFundController", accounts => {
  it("should deposit to the fund, approve and deposit to pools, accrue interest, and withdraw from the fund", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN_ADDRESS) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundPriceConsumer.at(process.env.UPGRADE_FUND_PRICE_CONSUMER_ADDRESS) : RariFundPriceConsumer.deployed());

    // Get currency prices in USD used by contracts
    var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();

    // For each currency of each pool
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var amountUsdBN = amountBN.mul(currencyPricesInUsd[Object.keys(currencies).indexOf(currencyCode)]).div(web3.utils.toBN(10 ** currencies[currencyCode].decimals));
      
      // Check balances
      let initialAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      let initialFundBalance = await fundManagerInstance.getFundBalance.call();
      let initialRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      
      // Approve tokens to RariFundManager
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check balances and interest
      let postDepositAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(postDepositAccountBalance.gte(initialAccountBalance.add(amountUsdBN).mul(web3.utils.toBN(999999)).div(web3.utils.toBN(1000000))));
      let postDepositFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(postDepositFundBalance.gte(initialFundBalance.add(amountUsdBN).mul(web3.utils.toBN(999999)).div(web3.utils.toBN(1000000))));
      let postDepositRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(postDepositRftBalance.gt(initialRftBalance));
      let postDepositInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
      let postDepositPoolBalance = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);

      // Deposit to pool (using Compound as an example)
      // TODO: Ideally, deposit to pool via rari-fund-rebalancer
      await fundControllerInstance.approveToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      await fundControllerInstance.depositToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Force accrue interest
      await new Promise(resolve => setTimeout(resolve, 1000));
      await web3.eth.sendTransaction({ from: process.env.DEVELOPMENT_ADDRESS, to: process.env.DEVELOPMENT_ADDRESS, value: 0 });

      // Check balances and interest after waiting for interest
      var requireInterestAccrual = ["DAI", "TUSD"].indexOf(currencyCode) >= 0;
      var acceptMarginOfError = (poolName == "dYdX" && currencyCode != "DAI") || poolName == "mStable";
      if (acceptMarginOfError) var usdMarginOfErrorBN = web3.utils.toBN(1e13);
      let preWithdrawalAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(preWithdrawalAccountBalance[requireInterestAccrual ? "gt" : "gte"](acceptMarginOfError ? postDepositAccountBalance.sub(usdMarginOfErrorBN) : postDepositAccountBalance));
      let preWithdrawalFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(preWithdrawalFundBalance[requireInterestAccrual ? "gt" : "gte"](acceptMarginOfError ? postDepositFundBalance.sub(usdMarginOfErrorBN) : postDepositFundBalance));
      let preWithdrawalRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(preWithdrawalRftBalance.eq(postDepositRftBalance));
      let preWithdrawalInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
      assert(preWithdrawalInterestAccrued[requireInterestAccrual ? "gt" : "gte"](acceptMarginOfError ? postDepositInterestAccrued.sub(usdMarginOfErrorBN) : postDepositInterestAccrued));
      let preWithdrawalPoolBalance = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);
      assert(preWithdrawalPoolBalance[requireInterestAccrual ? "gt" : "gte"](acceptMarginOfError ? postDepositPoolBalance.add(amountBN).subn(10) : postDepositPoolBalance.add(amountBN)));

      // RariFundManager.withdraw
      await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
      var withdrawalAmountBN = web3.utils.BN.min(amountBN, preWithdrawalPoolBalance);
      await fundManagerInstance.withdraw(currencyCode, withdrawalAmountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

      // TODO: Check balances and assert with post-interest balances
      let finalAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(finalAccountBalance.lt(preWithdrawalAccountBalance));
      let finalFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(finalFundBalance.lt(preWithdrawalFundBalance));
      let finalRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(finalRftBalance.lt(preWithdrawalRftBalance));
    }
  });
});

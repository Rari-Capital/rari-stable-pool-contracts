/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const erc20Abi = require('./abi/ERC20.json');
const mAssetValidationHelperAbi = require('./abi/MassetValidationHelper.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');
const exchanges = require('./fixtures/exchanges.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundPriceConsumer = artifacts.require("RariFundPriceConsumer");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundManager", accounts => {
  it("should set accepted currencies", async () => {
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN_ADDRESS) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundPriceConsumer.at(process.env.UPGRADE_FUND_PRICE_CONSUMER_ADDRESS) : RariFundPriceConsumer.deployed());

    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();
    var amountUsdBN = amountBN.mul(currencyPricesInUsd[Object.keys(currencies).indexOf(currencyCode)]).div(web3.utils.toBN(10 ** currencies[currencyCode].decimals));

    // Set DAI as unaccepted currency
    await fundManagerInstance.setAcceptedCurrencies([currencyCode], [false], { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Check to make sure DAI is now not accepted
    let daiAcceptedInitial = await fundManagerInstance.isCurrencyAccepted.call(currencyCode);
    assert.equal(daiAcceptedInitial, false);

    // Make sure we can't deposit DAI now
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
  
    try {
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This currency is not currently accepted; please convert your funds to an accepted currency before depositing.");
    }

    // Set DAI as accepted currency
    await fundManagerInstance.setAcceptedCurrencies([currencyCode], [true], { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Check to make sure DAI is now accepted
    let daiAcceptedNow = await fundManagerInstance.isCurrencyAccepted.call(currencyCode);
    assert.equal(daiAcceptedNow, true);

    // Make sure we can deposit DAI now
    let myOldBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    let myPostDepositBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(myPostDepositBalance.gte(myOldBalance.add(amountUsdBN).mul(web3.utils.toBN(999999)).div(web3.utils.toBN(1000000))));
    
    // Withdraw what we deposited
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    await fundManagerInstance.withdraw(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    let myNewBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
    assert(myNewBalance.lt(myPostDepositBalance));
  });
});

contract("RariFundController, RariFundManager", accounts => {
  it("should deposit to the fund, approve deposits to pools via RariFundController.approveToPool, and deposit to pools via RariFundController.depositToPool", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
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
      var initialBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);

      // Approve and deposit to pool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.approveToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      await fundControllerInstance.depositToPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      // Accounting for dYdX and Compound losing some dust using amountBN.mul(9999).div(10000)
      var postDepositBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);
      assert(postDepositBalanceOfUnderlying.gte(initialBalanceOfUnderlying.add(amountBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
    }
  });

  it("should withdraw half from all pools via RariFundController.withdrawFromPool", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());

    // For each currency of each pool:
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // Check initial pool balance
      var oldBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);
      
      // Calculate amount to deposit to & withdraw from the pool
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));

      // RariFundController.withdrawFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawFromPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, amountBN.div(web3.utils.toBN(2)), { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      var newBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);
      assert(newBalanceOfUnderlying.lt(oldBalanceOfUnderlying));
    }
  });

  it("should withdraw everything from all pools via RariFundController.withdrawAllFromPool", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    
    // For each currency of each pool:
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // RariFundController.withdrawAllFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawAllFromPool(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check new pool balance
      var newBalanceOfUnderlying = await fundControllerInstance.getPoolBalance.call(["dYdX", "Compound", "Aave", "mStable"].indexOf(poolName), currencyCode);
      assert(newBalanceOfUnderlying.isZero());
    }
  });
});

contract("RariFundController, RariFundManager", accounts => {
  it("should exchange tokens to and from mStable mUSD via RariFundController.mintMUsd and redeemMUsd", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundController.address = process.env.UPGRADE_FUND_CONTROLLER_ADDRESS;
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    var mUsdErc20Contract = new web3.eth.Contract(erc20Abi, currencies["mUSD"].tokenAddress);
    var mUsdAmountBN = web3.utils.toBN(10 ** (currencies["mUSD"].decimals - 1));

    // For each currency supported by mStable:
    for (const currencyCode of exchanges.mStableExchangeCurrencies) {
      var tokenAmountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var tokenErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);

      // Check mint validity
      var mAssetValidationHelper = new web3.eth.Contract(mAssetValidationHelperAbi, "0xabcc93c3be238884cc3309c19afd128fafc16911");

      try {
        var maxSwap = await mAssetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", currencies[currencyCode].tokenAddress, "0xe2f2a5c287993345a840db3b0845fbc70f5935a5").call();
      } catch (error) {
        // If the bAsset does not currently exist, move on to the next one
        assert.include(error.message, "bAsset must exist");
        continue;
      }

      var canMint = maxSwap && maxSwap["0"] && tokenAmountBN.lte(web3.utils.toBN(maxSwap["2"]));

      if (canMint) {
        // Approve and deposit tokens to RariFundManager
        await tokenErc20Contract.methods.approve(RariFundManager.address, tokenAmountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
        await fundManagerInstance.deposit(currencyCode, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      }

      // Check initial mUSD and token balance
      var initialMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
      var initialTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());

      if (canMint) {
        // RariFundController.approveToMUsd and RariFundController.swapMStable
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundControllerInstance.approveToMUsd(currencyCode, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
        await fundControllerInstance.swapMStable(currencyCode, "mUSD", tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      } else {
        // Deposit mUSD for redeeming if we didn't just mint
        await mUsdErc20Contract.methods.approve(RariFundManager.address, mUsdAmountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
        await fundManagerInstance.deposit("mUSD", mUsdAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      }

      // Check new mUSD and token balance
      var postMintMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(postMintMUsdBalanceBN.eq(initialMUsdBalanceBN.add(mUsdAmountBN)));
      var postMintTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(canMint ? postMintTokenBalanceBN.eq(initialTokenBalanceBN.sub(tokenAmountBN)) : postMintTokenBalanceBN.eq(initialTokenBalanceBN));

      // Check redeem validity
      var redeemValidity = await mAssetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", mUsdAmountBN.toString(), currencies[currencyCode].tokenAddress).call();

      if (redeemValidity && redeemValidity["0"]) {
        // RariFundController.swapMStable
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundControllerInstance.swapMStable("mUSD", currencyCode, mUsdAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });

        // Check new mUSD and token balance
        var postRedeemMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
        assert(postRedeemMUsdBalanceBN.eq(initialMUsdBalanceBN));
        var postRedeemTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());
        assert(postRedeemTokenBalanceBN.gte(postMintTokenBalanceBN.add(tokenAmountBN.muln(99).divn(100))));
      }
    }
  });
});

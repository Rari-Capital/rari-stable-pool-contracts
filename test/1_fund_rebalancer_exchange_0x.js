/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const ZeroExExchange = require('./exchanges/0x').default;

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const exchanges = require('./fixtures/exchanges.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");

var zeroExExchange = new ZeroExExchange(web3);

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundController, RariFundManager", accounts => {
  it("should exchange tokens", async () => {
    let fundControllerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundController.at(process.env.UPGRADE_FUND_CONTROLLER_ADDRESS) : RariFundController.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundController.address = process.env.UPGRADE_FUND_CONTROLLER_ADDRESS;
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // For each currency combination, calculate amount to deposit to the fund
    var deposits = {};

    for (const currencyCombination of exchanges.zeroExCurrencyCombinations) {
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCombination[0]].decimals - 1));
      deposits[currencyCombination[0]] ? deposits[currencyCombination[0]].iadd(amountBN) : deposits[currencyCombination[0]] = amountBN;
    }
    
    for (const currencyCode of Object.keys(deposits)) {
      // Approve tokens to RariFundManager
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, deposits[currencyCode].toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, deposits[currencyCode], { from: process.env.DEVELOPMENT_ADDRESS });
    }

    for (const currencyCombination of exchanges.zeroExCurrencyCombinations) {
      // Check source and destination wallet balances
      var inputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombination[0]].tokenAddress);
      var outputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombination[1]].tokenAddress);
      let oldInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let oldOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      
      // Calculate amount to exchange
      var maxInputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombination[0]].decimals - 1));
      
      // Calculate min marginal output amount to exchange funds
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      var minMarginalOutputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombination[1]].decimals - 1)); // At least 0.1 outputs per input; would set to 0.9 or something higher but we don't get always good prices for small amounts

      // Get estimated filled input amount from 0x swap API
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      // TODO: Actually test minMarginalOutputAmountBN
      var [orders, estimatedInputAmountBN, protocolFee, takerAssetFilledAmountBN] = await zeroExExchange.getSwapOrders(currencies[currencyCombination[0]].tokenAddress, currencies[currencyCombination[0]].decimals, currencies[currencyCombination[1]].tokenAddress, maxInputAmountBN, minMarginalOutputAmountBN);
      
      // Build array of orders and signatures
      var signatures = [];
      
      for (var j = 0; j < orders.length; j++) {
        signatures[j] = orders[j].signature;
        
        orders[j] = {
          makerAddress: orders[j].makerAddress,
          takerAddress: orders[j].takerAddress,
          feeRecipientAddress: orders[j].feeRecipientAddress,
          senderAddress: orders[j].senderAddress,
          makerAssetAmount: orders[j].makerAssetAmount,
          takerAssetAmount: orders[j].takerAssetAmount,
          makerFee: orders[j].makerFee,
          takerFee: orders[j].takerFee,
          expirationTimeSeconds: orders[j].expirationTimeSeconds,
          salt: orders[j].salt,
          makerAssetData: orders[j].makerAssetData,
          takerAssetData: orders[j].takerAssetData,
          makerFeeAssetData: orders[j].makerFeeAssetData,
          takerFeeAssetData: orders[j].takerFeeAssetData
        };
      }
      
      // Fill 0x orders
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.approveTo0x(currencies[currencyCombination[0]].tokenAddress, maxInputAmountBN);
      await fundControllerInstance.marketSell0xOrdersFillOrKill(currencyCombination[0], currencyCombination[1], orders, signatures, takerAssetFilledAmountBN.toString(), { from: process.env.DEVELOPMENT_ADDRESS, value: protocolFee, gas: 2e6 });

      // Check source and destination wallet balances
      let newInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let newOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(newInputBalanceBN.lt(oldInputBalanceBN));
      assert(newOutputBalanceBN.gte(oldOutputBalanceBN.add(web3.utils.toBN(Math.trunc(oldInputBalanceBN.sub(newInputBalanceBN).toString() / (10 ** currencies[currencyCombination[0]].decimals) * minMarginalOutputAmountBN.toString())))));
    }
  });
});

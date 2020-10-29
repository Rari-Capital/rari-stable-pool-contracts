/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const https = require('https');

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundProxy = artifacts.require("RariFundProxy");

function get0xSwapOrders(inputTokenAddress, outputTokenAddress, maxInputAmountBN, maxMakerAssetFillAmountBN) {
  return new Promise((resolve, reject) => {
    https.get('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + (maxMakerAssetFillAmountBN !== undefined ? '&buyAmount=' + maxMakerAssetFillAmountBN.toString() : '&sellAmount=' + maxInputAmountBN.toString()), (resp) => {
      let data = '';

      // A chunk of data has been recieved
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received
      resp.on('end', () => {
        var decoded = JSON.parse(data);
        if (!decoded) return reject("Failed to decode quote from 0x swap API");
        if (!decoded.orders) return reject("No orders found on 0x swap API");

        decoded.orders.sort((a, b) => a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee) ? 1 : -1);

        var orders = [];
        var inputFilledAmountBN = web3.utils.toBN(0);
        var takerAssetFilledAmountBN = web3.utils.toBN(0);
        var makerAssetFilledAmountBN = web3.utils.toBN(0);

        for (var i = 0; i < decoded.orders.length; i++) {
          if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData.toLowerCase() !== "0xf47261b0000000000000000000000000" + inputTokenAddress.toLowerCase()) continue;
          var takerAssetAmountBN = web3.utils.toBN(decoded.orders[i].takerAssetAmount);
          var takerFeeBN = web3.utils.toBN(decoded.orders[i].takerFee);
          var orderInputAmountBN = takerAssetAmountBN.add(takerFeeBN); // Maximum amount we can send to this order including the taker fee
          var makerAssetAmountBN = web3.utils.toBN(decoded.orders[i].makerAssetAmount);

          if (maxMakerAssetFillAmountBN !== undefined) {
            // maxMakerAssetFillAmountBN is specified, so use it
            if (maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN).lte(makerAssetAmountBN)) {
              // Calculate orderTakerAssetFillAmountBN and orderInputFillAmountBN from maxMakerAssetFillAmountBN
              var orderMakerAssetFillAmountBN = maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN);
              var orderTakerAssetFillAmountBN = orderMakerAssetFillAmountBN.mul(takerAssetAmountBN).div(makerAssetAmountBN);
              var orderInputFillAmountBN = orderMakerAssetFillAmountBN.mul(orderInputAmountBN).div(makerAssetAmountBN);
              
              var tries = 0;
              while (makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).lt(orderMakerAssetFillAmountBN)) {
                if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount: " + err, "Internal error");
                orderInputFillAmountBN.iadd(web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount
                tries++;
              }
            } else {
              // Fill whole order
              var orderMakerAssetFillAmountBN = makerAssetAmountBN;
              var orderTakerAssetFillAmountBN = takerAssetAmountBN;
              var orderInputFillAmountBN = orderInputAmountBN;
            }

            // If this order input amount is higher than the remaining input, calculate orderTakerAssetFillAmountBN and orderMakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
            if (orderInputFillAmountBN.gt(maxInputAmountBN.sub(inputFilledAmountBN))) {
              orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
              orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
              orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
            }
          } else {
            // maxMakerAssetFillAmountBN is not specified, so use maxInputAmountBN
            if (maxInputAmountBN.sub(inputFilledAmountBN).lte(orderInputAmountBN)) {
              // Calculate orderInputFillAmountBN and orderTakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
              var orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
              var orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
              var orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
            } else {
              // Fill whole order
              var orderInputFillAmountBN = orderInputAmountBN;
              var orderTakerAssetFillAmountBN = takerAssetAmountBN;
              var orderMakerAssetFillAmountBN = makerAssetAmountBN;
            }
          }

          // Add order to returned array
          orders.push(decoded.orders[i]);

          // Add order fill amounts to total fill amounts
          inputFilledAmountBN.iadd(orderInputFillAmountBN);
          takerAssetFilledAmountBN.iadd(orderTakerAssetFillAmountBN);
          makerAssetFilledAmountBN.iadd(orderMakerAssetFillAmountBN);
          
          // Check if we have hit maxInputAmountBN or maxTakerAssetFillAmountBN
          if (inputFilledAmountBN.gte(maxInputAmountBN) || (maxMakerAssetFillAmountBN !== undefined && makerAssetFilledAmountBN.gte(maxMakerAssetFillAmountBN))) break;
        }

        if (takerAssetFilledAmountBN.isZero()) return reject("No orders found on 0x swap API");
        resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, decoded.gasPrice]);
      });
    }).on("error", (err) => {
        reject("Error requesting prices from 0x swap API: " + err.message);
    });
  });
}

contract("RariFundProxy", accounts => {
  it("should withdraw and exchange all input currencies without using too much gas", async () => {
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN_ADDRESS) : RariFundToken.deployed());
    let fundProxyInstance = await RariFundProxy.deployed();

    // Exchange data
    var inputCurrencyCodes = [];
    var inputAmountBNs = [];
    var allOrders = [];
    var allSignatures = [];
    var makerAssetFillAmountBNs = [];
    var makerAssetFillAmountBNs = [];
    var protocolFeeBNs = [];
    var totalProtocolFeeBN = web3.utils.toBN(0);
    
    // For each currency, deposit to fund
    for (const currencyCode of Object.keys(currencies)) {
      // Approve and deposit tokens to the fund
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Get orders from 0x swap API
      var [orders, estimatedInputAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN] = await get0xSwapOrders(currencies[currencyCode].tokenAddress, "WETH", amountBN);
      
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

      inputCurrencyCodes.push(currencyCode);
      inputAmountBNs.push(amountBN);
      allOrders.push(orders);
      allSignatures.push(signatures);
      makerAssetFillAmountBNs.push(makerAssetFilledAmountBN);
      protocolFeeBNs.push(web3.utils.toBN(protocolFee));
      totalProtocolFeeBN.iadd(web3.utils.toBN(protocolFee));
    }

    // Approve RFT to RariFundManager
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1));
    
    // Fill 0x orders
    var result = await fundProxyInstance.withdrawAndExchange(inputCurrencyCodes, inputAmountBNs, "0x0000000000000000000000000000000000000000", allOrders, allSignatures, makerAssetFillAmountBNs, protocolFeeBNs, { value: totalProtocolFeeBN, gas: 8e6 });
    console.log("Gas usage of RariFundProxy.withdrawAndExchange:", result.receipt.gasUsed);
    assert.isAtMost(result.receipt.gasUsed, 8000000); // Assert it uses no more than 8 million gas
  });
});

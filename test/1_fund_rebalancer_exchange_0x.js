// SPDX-License-Identifier: UNLICENSED
const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const exchanges = require('./fixtures/exchanges.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundController, RariFundManager", accounts => {
  it("should exchange tokens via Uniswap V2", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundManager.at(process.env.UPGRADE_FUND_MANAGER_ADDRESS) : RariFundManager.deployed());
    if (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0) RariFundManager.address = process.env.UPGRADE_FUND_MANAGER_ADDRESS;

    // For each currency combination, calculate amount to deposit to the fund
    var deposits = {};

    for (const currencyCombination of exchanges.uniswapCurrencyPaths) {
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

    for (const currencyCombination of exchanges.uniswapCurrencyPaths) {
      // Check source and destination wallet balances
      var inputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombination[0]].tokenAddress);
      var outputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombination[currencyCombination.length - 1]].tokenAddress);
      let oldInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let oldOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      
      // Calculate amount to exchange
      var inputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombination[0]].decimals - 1));
      
      // Calculate min marginal output amount to exchange funds
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      var minOutputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombination[currencyCombination.length - 1]].decimals - 1)).muln(95).divn(100); // At least 0.95 outputs per input
      
      // Swap via Uniswap
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      var path = [];
      for (const currencyCode of currencyCombination) path.push(currencyCode === "WETH" ? "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" : currencies[currencyCode].tokenAddress);
      await fundControllerInstance.swapExactTokensForTokens(path, inputAmountBN, minOutputAmountBN, { from: process.env.DEVELOPMENT_ADDRESS, gas: 2e6 });

      // Check source and destination wallet balances
      let newInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let newOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(newInputBalanceBN.eq(oldInputBalanceBN.sub(inputAmountBN)));
      assert(newOutputBalanceBN.gte(oldOutputBalanceBN.add(minOutputAmountBN)));
    }
  });
      
  it("should fail to exchange tokens via Uniswap V2 if loss rate limit is breached", async () => {
    let fundControllerInstance = await RariFundController.deployed();

    // Try and fail to swap via Uniswap with the loss rate limit at almost negative infinity
    await fundControllerInstance.setExchangeLossRateLimit(web3.utils.toBN(2).pow(web3.utils.toBN(255)).neg());
    var inputAmountBN = web3.utils.toBN(10 ** (currencies["USDC"].decimals - 1));
    var minOutputAmountBN = web3.utils.toBN(10 ** (currencies["USDT"].decimals - 1)).muln(95).divn(100); // At least 0.95 outputs per input

    try {
      await fundControllerInstance.swapExactTokensForTokens([currencies["USDC"].tokenAddress, currencies["USDT"].tokenAddress], inputAmountBN, minOutputAmountBN, { from: process.env.DEVELOPMENT_ADDRESS, gas: 2e6 });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "Exchanges have been disabled.");
    }
  });
});

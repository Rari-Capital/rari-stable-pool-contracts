const ZeroExExchange = require('./exchanges/0x').default;

const erc20Abi = require('./abi/ERC20.json');
const soloMarginAbi = require('./abi/SoloMargin.json');
const cErc20DelegatorAbi = require('./abi/CErc20Delegator.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

var fundManagerWeb3Instance = new web3.eth.Contract(RariFundManager.abi, RariFundManager.address);
var zeroExExchange = new ZeroExExchange(web3);

async function getFundManagerUnderlyingDydxBalance(currencyCode) {
  var marketId = pools["dYdX"].currencies[currencyCode].marketId;
  var soloMarginContract = new web3.eth.Contract(soloMarginAbi, pools["dYdX"].soloMarginAddress);
  var result = await soloMarginContract.methods.getAccountBalances({ owner: RariFundManager.address, number: 0 }).call();
  var balance = result[2][marketId].value;
  return web3.utils.toBN(balance);
}

async function getFundManagerUnderlyingCompoundBalance(currencyCode) {
  var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools["Compound"].currencies[currencyCode].cTokenAddress);
  var balance = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();
  return web3.utils.toBN(balance);
}

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager v0.3.0", accounts => {
  it("should set accepted currencies", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // RariFundManager.setAcceptedCurrency(string calldata currencyCode, bool accepted)
    await fundManagerInstance.setAcceptedCurrency("DAI", false, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Check to make sure DAI is now not accepted
    let daiAcceptedInitial = await fundManagerInstance.isCurrencyAccepted.call("DAI");
    assert.equal(daiAcceptedInitial, false);

    // Make sure we can't deposit now (using DAI as an example)
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(1e17).toString()).send({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
  
    try {
      await fundManagerInstance.deposit("DAI", web3.utils.toBN(1e17), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This currency is not currently accepted; please convert your funds to an accepted currency before depositing.");
    }

    // RariFundManager.setAcceptedCurrency(string calldata currencyCode, bool accepted)
    await fundManagerInstance.setAcceptedCurrency("DAI", true, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Check to make sure DAI is now accepted
    let daiAcceptedNow = await fundManagerInstance.isCurrencyAccepted.call("DAI");
    assert.equal(daiAcceptedNow, true);

    // Make sure we can deposit now (using DAI as an example)
    let myOldBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    await fundManagerInstance.deposit("DAI", web3.utils.toBN(1e17), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostDepositBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert(myPostDepositBalance.gte(myOldBalance.add(web3.utils.toBN(1e17))));
    
    // Withdraw what we deposited
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundManagerInstance.withdraw("DAI", web3.utils.toBN(1e17), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myNewBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert(myNewBalance.lt(myPostDepositBalance));
  });

  it("should deposit to the fund, approve deposits to pools, and deposit to pools", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Use DAI as an example
    let currencyCode = "DAI";

    // Calculate amount to deposit to & withdraw from the fund
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var amountTotalBN = amountBN.mul(web3.utils.toBN(Object.keys(pools).length));

    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountTotalBN.toString()).send({ from: accounts[0] });

    // RariFundManager.deposit
    await fundManagerInstance.deposit(currencyCode, amountTotalBN, { from: accounts[0] });

    // For each each pool (using DAI as an example):
    for (const poolName of Object.keys(pools)) {
      // Check initial pool balance
      var initialBalanceOfUnderlying = await (poolName == "Compound" ? getFundManagerUnderlyingCompoundBalance(currencyCode) : getFundManagerUnderlyingDydxBalance(currencyCode));

      // Approve and deposit to pool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundManagerInstance.approveToPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
      await fundManagerInstance.depositToPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });

      // Check new pool balance
      // Accounting for dYdX and Compound losing some dust using amountBN.mul(9999).div(10000)
      var postDepositBalanceOfUnderlying = await (poolName == "Compound" ? getFundManagerUnderlyingCompoundBalance(currencyCode) : getFundManagerUnderlyingDydxBalance(currencyCode));
      assert(postDepositBalanceOfUnderlying.gte(initialBalanceOfUnderlying.add(amountBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
    }
  });

  it("should withdraw half from all pools via RariFundManager.withdrawFromPool", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Use DAI as an example
    let currencyCode = "DAI";

    // For each each pool (using DAI as an example):
    for (const poolName of Object.keys(pools)) {
      var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools[poolName].currencies[currencyCode].cTokenAddress);

      // Check initial pool balance
      var oldBalanceOfUnderlying = await (poolName == "Compound" ? getFundManagerUnderlyingCompoundBalance(currencyCode) : getFundManagerUnderlyingDydxBalance(currencyCode));
      
      // Calculate amount to deposit to & withdraw from the pool
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));

      // RariFundManager.withdrawFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundManagerInstance.withdrawFromPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN.div(web3.utils.toBN(2)), { from: accounts[0] });

      // Check new pool balance
      var newBalanceOfUnderlying = await (poolName == "Compound" ? getFundManagerUnderlyingCompoundBalance(currencyCode) : getFundManagerUnderlyingDydxBalance(currencyCode));
      assert(newBalanceOfUnderlying.lt(oldBalanceOfUnderlying));
    }
  });

  it("should withdraw everything from all pools via RariFundManager.withdrawAllFromPool", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Use DAI as an example
    let currencyCode = "DAI";

    // For each each pool (using DAI as an example):
    for (const poolName of Object.keys(pools)) {
      var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools[poolName].currencies[currencyCode].cTokenAddress);

      // RariFundManager.withdrawAllFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundManagerInstance.withdrawAllFromPool(poolName == "Compound" ? 1 : 0, currencyCode, { from: accounts[0] });

      // Check new pool balance
      var newBalanceOfUnderlying = await (poolName == "Compound" ? getFundManagerUnderlyingCompoundBalance(currencyCode) : getFundManagerUnderlyingDydxBalance(currencyCode));
      assert(newBalanceOfUnderlying.isZero());
    }
  });

  it("should exchange tokens", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency combination:
    var currencyCombinations = [["DAI", "USDC"], ["DAI", "USDT"], ["USDC", "DAI"], ["USDC", "USDT"], ["USDT", "DAI"], ["USDT", "USDC"]];
    
    for (const currencyCode of Object.keys(currencies)) {
      // Calculate amount to deposit to & withdraw from the fund
      var amountTotalBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1)).mul(web3.utils.toBN(2));

      // Approve tokens to RariFundManager
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountTotalBN.toString()).send({ from: accounts[0] });

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, amountTotalBN, { from: accounts[0] });
    }

    for (var i = 0; i < currencyCombinations.length; i++) {
      // Check source and destination wallet balances
      var inputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombinations[i][0]].tokenAddress);
      var outputErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCombinations[i][1]].tokenAddress);
      let oldInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundManager.address).call());
      let oldOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundManager.address).call());
      
      // Calculate amount to exchange
      var maxInputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombinations[i][0]].decimals - 1));
      
      // Calculate min marginal output amount to exchange funds
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      var price = await zeroExExchange.getPrice(currencyCombinations[i][0], currencyCombinations[i][1]);
      var minMarginalOutputAmount = 1 / parseFloat(price) * 0.9;
      var minMarginalOutputAmountBN = web3.utils.toBN(parseInt(minMarginalOutputAmount * (10 ** currencies[currencyCombinations[i][1]].decimals)));

      // Get estimated filled input amount from 0x swap API
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      // TODO: Actually test minMarginalOutputAmountBN
      var [orders, estimatedInputAmountBN, protocolFee, takerAssetFilledAmountBN] = await zeroExExchange.getSwapOrders(currencies[currencyCombinations[i][0]].tokenAddress, currencies[currencyCombinations[i][0]].decimals, currencies[currencyCombinations[i][1]].tokenAddress, maxInputAmountBN, minMarginalOutputAmountBN);
      
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
      await fundManagerInstance.approveTo0x(currencyCombinations[i][0], maxInputAmountBN);
      await fundManagerWeb3Instance.methods.fill0xOrdersUpTo(currencyCombinations[i][0], currencyCombinations[i][1], orders, signatures, takerAssetFilledAmountBN.toString()).send({ from: accounts[0], value: web3.utils.toBN(protocolFee).toString() });

      // Check source and destination wallet balances
      let newInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundManager.address).call());
      let newOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundManager.address).call());
      assert(newInputBalanceBN.lt(oldInputBalanceBN));
      assert(newOutputBalanceBN.gte(oldOutputBalanceBN.add(web3.utils.toBN(parseInt(oldInputBalanceBN.sub(newInputBalanceBN).toString() / (10 ** currencies[currencyCombinations[i][0]].decimals) * minMarginalOutputAmountBN.toString())))));
    }
  });
});

const ZeroExExchange = require('./exchanges/0x').default;

const erc20Abi = require('./abi/ERC20.json');
const soloMarginAbi = require('./abi/SoloMargin.json');
const cErc20DelegatorAbi = require('./abi/CErc20Delegator.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

var fundControllerWeb3Instance = new web3.eth.Contract(RariFundController.abi, RariFundController.address);
var zeroExExchange = new ZeroExExchange(web3);

async function getFundControllerUnderlyingDydxBalance(currencyCode) {
  var marketId = pools["dYdX"].currencies[currencyCode].marketId;
  var soloMarginContract = new web3.eth.Contract(soloMarginAbi, pools["dYdX"].soloMarginAddress);
  var result = await soloMarginContract.methods.getAccountBalances({ owner: RariFundController.address, number: 0 }).call();
  var balance = result[2][marketId].value;
  return web3.utils.toBN(balance);
}

async function getFundControllerUnderlyingCompoundBalance(currencyCode) {
  var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools["Compound"].currencies[currencyCode].cTokenAddress);
  var balance = await cErc20Contract.methods.balanceOfUnderlying(RariFundController.address).call();
  return web3.utils.toBN(balance);
}

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to accounts[0]
contract("RariFundManager", accounts => {
  it("should set accepted currencies", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    
    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));

    // Set DAI as unaccepted currency
    await fundManagerInstance.setAcceptedCurrency(currencyCode, false, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Check to make sure DAI is now not accepted
    let daiAcceptedInitial = await fundManagerInstance.isCurrencyAccepted.call(currencyCode);
    assert.equal(daiAcceptedInitial, false);

    // Make sure we can't deposit DAI now
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
  
    try {
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This currency is not currently accepted; please convert your funds to an accepted currency before depositing.");
    }

    // Set DAI as accepted currency
    await fundManagerInstance.setAcceptedCurrency(currencyCode, true, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Check to make sure DAI is now accepted
    let daiAcceptedNow = await fundManagerInstance.isCurrencyAccepted.call(currencyCode);
    assert.equal(daiAcceptedNow, true);

    // Make sure we can deposit DAI now
    let myOldBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostDepositBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myPostDepositBalance.gte(myOldBalance.add(amountUsdBN).mul(web3.utils.toBN(999999)).div(web3.utils.toBN(1000000))));
    
    // Withdraw what we deposited
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myNewBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myNewBalance.lt(myPostDepositBalance));
  });
});

contract("RariFundController, RariFundManager", accounts => {
  it("should deposit to the fund, approve deposits to pools via RariFundController.approveToPool, and deposit to pools via RariFundController.depositToPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();
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
      var initialBalanceOfUnderlying = await (poolName == "Compound" ? getFundControllerUnderlyingCompoundBalance(currencyCode) : getFundControllerUnderlyingDydxBalance(currencyCode));

      // Approve and deposit to pool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.approveToPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
      await fundControllerInstance.depositToPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });

      // Check new pool balance
      // Accounting for dYdX and Compound losing some dust using amountBN.mul(9999).div(10000)
      var postDepositBalanceOfUnderlying = await (poolName == "Compound" ? getFundControllerUnderlyingCompoundBalance(currencyCode) : getFundControllerUnderlyingDydxBalance(currencyCode));
      assert(postDepositBalanceOfUnderlying.gte(initialBalanceOfUnderlying.add(amountBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
    }
  });

  it("should withdraw half from all pools via RariFundController.withdrawFromPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    
    // Use DAI as an example
    let currencyCode = "DAI";

    // For each each pool (using DAI as an example):
    for (const poolName of Object.keys(pools)) {
      // Check initial pool balance
      var oldBalanceOfUnderlying = await (poolName == "Compound" ? getFundControllerUnderlyingCompoundBalance(currencyCode) : getFundControllerUnderlyingDydxBalance(currencyCode));
      
      // Calculate amount to deposit to & withdraw from the pool
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));

      // RariFundManager.withdrawFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawFromPool(poolName == "Compound" ? 1 : 0, currencyCode, amountBN.div(web3.utils.toBN(2)), { from: accounts[0] });

      // Check new pool balance
      var newBalanceOfUnderlying = await (poolName == "Compound" ? getFundControllerUnderlyingCompoundBalance(currencyCode) : getFundControllerUnderlyingDydxBalance(currencyCode));
      assert(newBalanceOfUnderlying.lt(oldBalanceOfUnderlying));
    }
  });

  it("should withdraw everything from all pools via RariFundController.withdrawAllFromPool", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    
    // Use DAI as an example
    let currencyCode = "DAI";

    // For each each pool (using DAI as an example):
    for (const poolName of Object.keys(pools)) {
      // RariFundManager.withdrawAllFromPool
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      await fundControllerInstance.withdrawAllFromPool(poolName == "Compound" ? 1 : 0, currencyCode, { from: accounts[0] });

      // Check new pool balance
      var newBalanceOfUnderlying = await (poolName == "Compound" ? getFundControllerUnderlyingCompoundBalance(currencyCode) : getFundControllerUnderlyingDydxBalance(currencyCode));
      assert(newBalanceOfUnderlying.isZero());
    }
  });

  it("should exchange tokens", async () => {
    let fundControllerInstance = await RariFundController.deployed();
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
      let oldInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let oldOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      
      // Calculate amount to exchange
      var maxInputAmountBN = web3.utils.toBN(10 ** (currencies[currencyCombinations[i][0]].decimals - 1));
      
      // Calculate min marginal output amount to exchange funds
      // TODO: Ideally, we add actually call rari-fund-rebalancer
      var price = await zeroExExchange.getPrice(currencyCombinations[i][0], currencyCombinations[i][1]);
      var minMarginalOutputAmount = 1 / parseFloat(price) * 0.9;
      var minMarginalOutputAmountBN = web3.utils.toBN(Math.trunc(minMarginalOutputAmount * (10 ** currencies[currencyCombinations[i][1]].decimals)));

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
      await fundControllerInstance.approveTo0x(currencies[currencyCombinations[i][0]].tokenAddress, maxInputAmountBN);
      await fundControllerWeb3Instance.methods.marketSell0xOrdersFillOrKill(orders, signatures, takerAssetFilledAmountBN.toString()).send({ from: accounts[0], value: web3.utils.toBN(protocolFee).toString() });

      // Check source and destination wallet balances
      let newInputBalanceBN = web3.utils.toBN(await inputErc20Contract.methods.balanceOf(RariFundController.address).call());
      let newOutputBalanceBN = web3.utils.toBN(await outputErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(newInputBalanceBN.lt(oldInputBalanceBN));
      assert(newOutputBalanceBN.gte(oldOutputBalanceBN.add(web3.utils.toBN(Math.trunc(oldInputBalanceBN.sub(newInputBalanceBN).toString() / (10 ** currencies[currencyCombinations[i][0]].decimals) * minMarginalOutputAmountBN.toString())))));
    }
  });
});

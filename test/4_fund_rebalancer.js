const erc20Abi = require('./abi/ERC20.json');
const mAssetValidationHelperAbi = require('./abi/MassetValidationHelper.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');
const exchanges = require('./fixtures/exchanges.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundManager", accounts => {
  it("should set accepted currencies", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    
    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));

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
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();

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
    let fundControllerInstance = await RariFundController.deployed();

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
    let fundControllerInstance = await RariFundController.deployed();
    
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
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    var mUsdErc20Contract = new web3.eth.Contract(erc20Abi, currencies["mUSD"].tokenAddress);
    var mUsdAmountBN = web3.utils.toBN(10 ** (currencies["mUSD"].decimals - 1));

    // For each currency supported by mStable:
    for (const currencyCode of exchanges.mStableExchangeCurrencies) {
      // Approve and deposit tokens to RariFundManager
      var tokenAmountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var tokenErc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await tokenErc20Contract.methods.approve(RariFundManager.address, tokenAmountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
      await fundManagerInstance.deposit(currencyCode, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Check initial mUSD and token balance
      var initialMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
      var initialTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());

      // Check mint validity
      var mAssetValidationHelper = new web3.eth.Contract(mAssetValidationHelperAbi, "0xabcc93c3be238884cc3309c19afd128fafc16911");
      var maxSwap = await mAssetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", currencies[currencyCode].tokenAddress, "0xe2f2a5c287993345a840db3b0845fbc70f5935a5").call();

      if (maxSwap && maxSwap["0"] && tokenAmountBN.lte(web3.utils.toBN(maxSwap["2"]))) {
        // RariFundController.approveToMUsd and RariFundController.mintMUsd
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundControllerInstance.approveToMUsd(currencies[currencyCode].tokenAddress, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
        await fundControllerInstance.mintMUsd(currencies[currencyCode].tokenAddress, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      } else {
        // Deposit mUSD for redeeming if we didn't just mint
        await mUsdErc20Contract.methods.approve(RariFundManager.address, mUsdAmountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
        await fundManagerInstance.deposit("mUSD", mUsdAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      }

      // Check new mUSD and token balance
      var postMintMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(postMintMUsdBalanceBN.eq(initialMUsdBalanceBN.add(mUsdAmountBN)));
      var postMintTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());
      assert(postMintTokenBalanceBN.eq(initialTokenBalanceBN.sub(tokenAmountBN)));

      // Check redeem validity
      var redeemValidity = await mAssetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", mUsdAmountBN.toString(), currencies[currencyCode].tokenAddress).call();

      if (redeemValidity && redeemValidity["0"]) {
        // RariFundController.redeemMUsd
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundControllerInstance.redeemMUsd(currencies[currencyCode].tokenAddress, tokenAmountBN, { from: process.env.DEVELOPMENT_ADDRESS });

        // Check new mUSD and token balance
        var postRedeemMUsdBalanceBN = web3.utils.toBN(await mUsdErc20Contract.methods.balanceOf(RariFundController.address).call());
        assert(postRedeemMUsdBalanceBN.eq(initialMUsdBalanceBN));
        var postRedeemTokenBalanceBN = web3.utils.toBN(await tokenErc20Contract.methods.balanceOf(RariFundController.address).call());
        assert(postRedeemTokenBalanceBN.gte(initialTokenBalanceBN.sub(tokenAmountBN.divn(100))));
      }
    }
  });
});

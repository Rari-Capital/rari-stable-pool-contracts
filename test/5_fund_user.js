const erc20Abi = require('./abi/ERC20.json');
const cErc20DelegatorAbi = require('./abi/CErc20Delegator.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

async function forceAccrueCompound(currencyCode, account) {
  var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools["Compound"].currencies[currencyCode].cTokenAddress);
  
  try {
    await cErc20Contract.methods.accrueInterest().send({ from: account, nonce: await web3.eth.getTransactionCount(account) });
  } catch (error) {
    try {
      await cErc20Contract.methods.accrueInterest().send({ from: account, nonce: await web3.eth.getTransactionCount(account) });
    } catch (error) {
      console.error("Both attempts to force accrue interest on Compound " + currencyCode + " failed. Not trying again!");
    }
  }
}

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundManager, RariFundController", accounts => {
  it("should make a deposit, deposit to pools, accrue interest, and make a withdrawal", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());

    // Use Compound as an example
    for (const currencyCode of Object.keys(pools["Compound"].currencies)) {
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));
      
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

      // Deposit to pool (using Compound as an example)
      // TODO: Ideally, deposit to pool via rari-fund-rebalancer
      await fundControllerInstance.approveToPool(1, currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });
      await fundControllerInstance.depositToPool(1, currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

      // Force accrue interest
      await forceAccrueCompound(currencyCode, process.env.DEVELOPMENT_ADDRESS);

      // Check balances and interest after waiting for interest
      let preWithdrawalAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(preWithdrawalAccountBalance.gt(postDepositAccountBalance));
      let preWithdrawalFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(preWithdrawalFundBalance.gt(postDepositFundBalance));
      let preWithdrawalRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS);
      assert(preWithdrawalRftBalance.eq(postDepositRftBalance));
      let preWithdrawalInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
      assert(preWithdrawalInterestAccrued.gt(postDepositInterestAccrued));

      // RariFundManager.withdraw
      await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

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

const erc20Abi = require('./abi/ERC20.json');
const cErc20DelegatorAbi = require('./abi/CErc20Delegator.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

async function forceAccrueCompound(currencyCode, account) {
  var cErc20Contract = new web3.eth.Contract(cErc20DelegatorAbi, pools["Compound"].currencies[currencyCode].cTokenAddress);
  await cErc20Contract.methods.accrueInterest().send({ from: account });
}

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager v0.3.0", accounts => {
  it("should make a deposit, deposit to pools, accrue interest, make a withdrawal, withdraw from pools, and process pending withdrawals", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // Use Compound as an example
    for (const currencyCode of Object.keys(pools["Compound"].currencies)) {
      console.log(currencyCode);
      
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));
      
      // Check balances
      let initialAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
      let initialFundBalance = await fundManagerInstance.getFundBalance.call();
      let initialRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      
      // Approve tokens to RariFundManager
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });

      // Check balances
      let postDepositAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
      assert(postDepositAccountBalance.eq(initialAccountBalance.add(amountUsdBN)));
      let postDepositFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(postDepositFundBalance.eq(initialFundBalance.add(amountUsdBN)));
      let postDepositRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      assert(postDepositRftBalance.gt(initialRftBalance));

      // Deposit to pool (using Compound as an example)
      // TODO: Ideally, deposit to pool via rari-fund-rebalancer
      await fundManagerInstance.approveToPool(1, currencyCode, amountBN, { from: accounts[0] });
      await fundManagerInstance.depositToPool(1, currencyCode, amountBN, { from: accounts[0] });

      // Force accrue interest
      await forceAccrueCompound(currencyCode, accounts[0]);

      // Check balances after waiting for interest
      let preWithdrawalAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
      assert(preWithdrawalAccountBalance.gt(postDepositAccountBalance));
      let preWithdrawalFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(preWithdrawalFundBalance.gt(postDepositFundBalance));
      let preWithdrawalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      assert(preWithdrawalRftBalance.eq(postDepositRftBalance));

      // RariFundManager.withdraw
      await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0] });
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0] });

      // Withdraw from pools and process pending withdrawals
      // TODO: Ideally, withdraw from pool and process pending withdrawals via rari-fund-rebalancer
      await fundManagerInstance.withdrawAllFromPool(1, currencyCode, { from: accounts[0] });
      await fundManagerInstance.processPendingWithdrawals(currencyCode, { from: accounts[0] });

      // TODO: Check balances and assert with post-interest balances
      let finalAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
      assert(finalAccountBalance.lt(preWithdrawalAccountBalance));
      let finalFundBalance = await fundManagerInstance.getFundBalance.call();
      assert(finalFundBalance.lt(preWithdrawalFundBalance));
      let finalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      assert(finalRftBalance.lt(preWithdrawalRftBalance));
    }
  });
});

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager v0.3.0", accounts => {
  it("should make a deposit, deposit to pools, accrue interest, make a withdrawal, withdraw from pools, and process pending withdrawals", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // Use Compound as an example
    for (const currencyCode of Object.keys(pools["Compound"].currencies)) {
      console.log(currencyCode);
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      
      // Check balances
      let initialAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
      let initialCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
      let initialUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
      let initialRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      
      // Approve tokens to RariFundManager
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });

      // Check balances
      let postDepositAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
      assert(postDepositAccountBalance.gte(initialAccountBalance.add(amountBN)));
      let postDepositCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
      assert(postDepositCurrencyBalance.gte(initialCurrencyBalance.add(amountBN)));
      let postDepositUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
      assert(postDepositUsdBalance.gte(initialUsdBalance.add(amountBN)));
      let postDepositRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      assert(postDepositRftBalance.gt(initialRftBalance));

      // Deposit to pool (using Compound as an example)
      // TODO: Ideally, deposit to pool via rari-fund-rebalancer
      await fundManagerInstance.approveToPool(1, currencyCode, amountBN, { from: accounts[0] });
      await fundManagerInstance.depositToPool(1, currencyCode, amountBN, { from: accounts[0] });

      // TODO: Wait for interest
      // TODO: Actually wait for interest and time out after x minutes
      // await new Promise(resolve => setTimeout(resolve, 60 * 1000));
      
      // TODO: Check balances after waiting for interest
      let preWithdrawalAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
      // assert(preWithdrawalAccountBalance.gt(postDepositAccountBalance));
      let preWithdrawalCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
      // assert(preWithdrawalCurrencyBalance.gt(postDepositCurrencyBalance));
      let preWithdrawalUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
      // assert(preWithdrawalUsdBalance.gt(postDepositUsdBalance));
      let preWithdrawalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      // assert(preWithdrawalRftBalance.eq(postDepositRftBalance));

      // RariFundManager.withdraw
      await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0] });
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0] });

      // Withdraw from pools and process pending withdrawals
      // TODO: Ideally, withdraw from pool and process pending withdrawals via rari-fund-rebalancer
      await fundManagerInstance.withdrawAllFromPool(1, currencyCode, { from: accounts[0] });
      await fundManagerInstance.processPendingWithdrawals(currencyCode, { from: accounts[0] });

      // TODO: Check balances and assert with post-interest balances
      let finalAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
      assert(finalAccountBalance.lt(preWithdrawalAccountBalance));
      let finalCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
      assert(finalCurrencyBalance.lt(preWithdrawalCurrencyBalance));
      let finalUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
      assert(finalUsdBalance.lt(preWithdrawalUsdBalance));
      let finalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      assert(finalRftBalance.lt(preWithdrawalRftBalance));
    }
  });
});

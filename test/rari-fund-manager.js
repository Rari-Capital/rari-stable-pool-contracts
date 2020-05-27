const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

contract("RariFundManager v0.3.0", async accounts => {
  it("should put upgrade the FundManager by withdrawing all tokens from all pools and transferring them as well as ETH to the new FundManager", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // Check balances in original FundManager
    var oldTokenBalances = {};
    for (const currencyCode of ["DAI", "USDC", "USDT"]) oldTokenBalances[currencyCode] = await fundManagerInstance.getRawTotalBalance.call(currencyCode);
    let ethBalanceOld = await web3.eth.getBalance(RariFundManager.address);

    // Create new FundManager
    // TODO: Test that we can make changes to the code of the new fund manager before deploying it and upgrading to it
    var newFundManagerInstance = await RariFundManager.new([], { from: accounts[0] });

    // Upgrade!
    await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address);

    // Check balances in new FundManager
    for (const currencyCode of ["DAI", "USDC", "USDT"]) {
      let newTokenBalance = await newFundManagerInstance.getRawTotalBalance().call(currencyCode);
      assert.atLeast(newTokenBalance.valueOf(), oldTokenBalances[currencyCode].valueOf());
    }

    let ethBalanceNew = await web3.eth.getBalance(RariFundManager.address);
    if (ethBalanceOld.toNumber() > 0) assert.greater(ethBalanceNew.valueOf(), 0); // TODO: Implement better assertion technique considering fees
  });

  it("should put upgrade the FundToken", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // Create new FundToken
    // TODO: Test that we can make changes to the code of the new fund token before deploying it and upgrading to it
    var newFundTokenInstance = await RariFundToken.new([], { from: accounts[0] });

    // Copy balances from the old to the new FundToken
    // TODO: Actually pull the token holders from somewhere (how do we do this? I don't have the resources to get an ERC20 token balance list from anywhere other than Etherscan)
    var tokenHolders = [accounts[0]];
    var tokenBalances = [];

    for (var i = 0; i < tokenHolders.length; i++) {
      var balance = await fundTokenInstance.balanceOf(tokenHolders[i]);
      tokenBalances.push(balance.valueOf());
    }
    
    // TODO: Implement RariFundToken.upgrade(uint256[] memory accounts, uint256[] memory balances)
    fundTokenInstance.upgrade(tokenHolders, tokenBalances);

    // RariFundManager.setFundToken(address newContract)
    await fundManagerInstance.setFundToken(newFundTokenInstance.address, { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundTokenContract (no way to do this as of now)

    // Check balances to make sure they're the same
    for (var i = 0; i < tokenHolders.length; i++) {
      var balance = await newFundTokenInstance.balanceOf(tokenHolders[i]);
      assert.equal([tokenBalances[i], balance.valueOf()]);
    }
  });

  it("should put upgrade the FundRebalancer", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setFundRebalancer(address newAddress)
    await fundManagerInstance.setFundRebalancer("0x0000000000000000000000000000000000000000", { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundRebalancerAddress (no way to do this as of now)
    // TODO: Ideally, we actually test the fund rebalancer
  });

  it("should disable and re-enable the fund", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.disableFund()
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)
    
    // Make sure we can't deposit or withdraw now (using DAI as an example)
    let myInitialBalance = fundManagerInstance.usdBalanceOf.call(accounts[0]);
    await fundManagerInstance.deposit("DAI", 1, { from: accounts[0] });
    let myNewBalance = fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert.equal(myNewBalance.toNumber(), myOldBalance.toNumber());
    await fundManagerInstance.withdraw("DAI", 1, { from: accounts[0] });
    let myNewBalance = fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert.equal(myNewBalance.toNumber(), myOldBalance.toNumber());

    // RariFundManager.enableFund()
    await fundManagerInstance.enableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Make sure we can deposit and withdraw now (using DAI as an example)
    await fundManagerInstance.deposit("DAI", 1, { from: accounts[0] });
    let myNewBalance = fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert.greater(myNewBalance.toNumber(), myOldBalance.toNumber());
  });

  it("should make a deposit, deposit to pools, accrue interest, make a withdrawal, withdraw from pools, and process pending withdrawals", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    for (const currencyCode of ["DAI", "USDC", "USDT"]) {
      // Approve tokens to RariFundManager
      var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
      await erc20Contract.approve(RariFundManager.address, 1).send({ from: accounts[0] });
      
      // Check RariFundManager.usdBalanceOf(string currencyCode, address account)
      let initialAccountBalance = await fundManagerInstance.usdBalanceOf.call(currencyCode, accounts[0]);

      // Check RariFundManager.getTotalBalance(string currencyCode)
      let initialCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);

      // Check RariFundManager.getCombinedUsdBalance()
      let initialUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();

      // Check RariFundToken.balanceOf(address account)
      let initialRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);

      // RariFundManager.deposit
      await fundManagerInstance.deposit(currencyCode, 1, { from: accounts[0] });

      // Check RariFundManager.usdBalanceOf(string currencyCode, address account)
      let postDepositAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
      Assert.isAbove(postDepositAccountBalance.toNumber(), initialAccountBalance.toNumber());

      // Check RariFundManager.getTotalBalance(string currencyCode)
      let postDepositCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
      Assert.isAbove(postDepositCurrencyBalance.toNumber(), initialCurrencyBalance.toNumber());

      // Check RariFundManager.getCombinedUsdBalance()
      let postDepositUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
      Assert.isAbove(postDepositUsdBalance.toNumber(), initialUsdBalance.toNumber());

      // Check RariFundToken.balanceOf(address account)
      let postDepositRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
      Assert.isAbove(postDepositRftBalance.toNumber(), initialRftBalance.toNumber());

      // Deposit to pool (using dYdX and DAI as an example)
      // TODO: Ideally, deposit to pool via rari-fund-rebalancer
      await fundManagerInstance.depositToPool(0, "DAI", 1e18);

      // Wait for interest
      // TODO: Actually wait for interest and time out after 5 minutes
      setTimeout(function() {
        // Check RariFundManager.usdBalanceOf(string currencyCode, address account)
        let preWithdrawalAccountBalance = await fundManagerInstance.usdBalanceOf.call(currencyCode, accounts[0]);
        Assert.isAbove(preWithdrawalAccountBalance.toNumber(), postDepositAccountBalance.toNumber() + 1e18);

        // Check RariFundManager.getTotalBalance(string currencyCode)
        let preWithdrawalCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
        Assert.isAbove(preWithdrawalCurrencyBalance.toNumber(), postDepositCurrencyBalance.toNumber() + 1e18);

        // Check RariFundManager.getCombinedUsdBalance()
        let preWithdrawalUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
        Assert.isAbove(preWithdrawalUsdBalance.toNumber(), postDepositUsdBalance.toNumber() + 1e18);

        // Check RariFundToken.balanceOf(address account)
        let preWithdrawalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
        Assert.equal(preWithdrawalRftBalance.valueOf(), postDepositRftBalance.valueOf());

        // RariFundManager.withdraw
        await fundManagerInstance.withdraw("DAI", 1, { from: accounts[0] });

        // Process pending withdrawals via RariFundManager.withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount), RariFundManager.exchangeTokens and RariFundManager.processPendingWithdrawals(string currencyCode)
        // TODO: Ideally, withdraw from pool and process pending withdrawals via rari-fund-rebalancer
        await fundManagerInstance.withdrawFromPool(0, "DAI", 1e18);
        await fundManagerInstance.processPendingWithdrawals("DAI");

        // Check RariFundManager.usdBalanceOf(string currencyCode, address account)
        let finalAccountBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
        Assert.isBelow(finalAccountBalance.toNumber(), preWithdrawalAccountBalance.toNumber() - 1e18);

        // Check RariFundManager.getTotalBalance(string currencyCode)
        let finalCurrencyBalance = await fundManagerInstance.getTotalBalance.call(currencyCode);
        Assert.isBelow(finalCurrencyBalance.toNumber(), preWithdrawalCurrencyBalance.toNumber() - 1e18);

        // Check RariFundManager.getCombinedUsdBalance()
        let finalUsdBalance = await fundManagerInstance.getCombinedUsdBalance.call();
        Assert.isBelow(finalUsdBalance.toNumber(), preWithdrawalUsdBalance.toNumber() - 1e18);

        // Check RariFundToken.balanceOf(address account)
        let finalRftBalance = await fundTokenInstance.balanceOf.call(accounts[0]);
        Assert.isBelow(finalRftBalance.toNumber(), preWithdrawalRftBalance.toNumber());
      }, 5 * 60 * 1000);
    }
  });

  it("should approve deposits to and deposit to pools", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency and for each pool:
    var cErc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}
    var pools = [["DAI", "USDC"], ["DAI", "USDC", "USDT"]];

    for (var i = 0; i < pools.length; i++)
      for (var j = 0; i < pools[i].length; j++) {
        // Check initial pool balance
        var cErc20Contract = new this.web3.eth.Contract(cErc20DelegatorAbi, cErc20Contracts[pools[i][j]]);
        var oldBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();

        // RariFundManager.approveToPool(uint8 pool, string calldata currencyCode, uint256 amount)
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundManagerInstance.approveToPool(i, pools[i][j], 1, { from: accounts[0] });

        // RariFundManager.depositToPool(uint8 pool, string calldata currencyCode, uint256 amount)
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundManagerInstance.depositToPool(i, pools[i][j], 1, { from: accounts[0] });

        // Check new pool balance
        var newBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();
        assert.equal(oldBalanceOfUnderlying.valueOf() + 1, newBalanceOfUnderlying.valueOf())
      }
  });

  it("should withdraw everything from all pools via RariFundManager.withdrawFromPool", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency and for each pool:
    var cErc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}
    var pools = [["DAI", "USDC"], ["DAI", "USDC", "USDT"]];

    for (var i = 0; i < pools.length; i++)
      for (var j = 0; i < pools[i].length; j++) {
        // Check initial pool balance
        var cErc20Contract = new this.web3.eth.Contract(cErc20DelegatorAbi, cErc20Contracts[pools[i][j]]);
        var oldBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();

        // RariFundManager.withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount)
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundManagerInstance.withdrawFromPool(i, pools[i][j], oldBalanceOfUnderlying, { from: accounts[0] });

        // Check new pool balance
        var newBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();
        assert.equal(newBalanceOfUnderlying.valueOf(), 0);
      }
  });

  it("should withdraw everything from all pools via RariFundManager.withdrawAllFromPool", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency and for each pool:
    var cErc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}
    var pools = [["DAI", "USDC"], ["DAI", "USDC", "USDT"]];

    for (var i = 0; i < pools.length; i++)
      for (var j = 0; i < pools[i].length; j++) {
        var cErc20Contract = new this.web3.eth.Contract(cErc20DelegatorAbi, cErc20Contracts[pools[i][j]]);

        // RariFundManager.withdrawAllFromPool
        // TODO: Ideally, we add actually call rari-fund-rebalancer
        await fundManagerInstance.withdrawAllFromPool(i, pools[i][j], { from: accounts[0] });

        // Check new pool balance
        var newBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying(RariFundManager.address).call();
        assert.equal(newBalanceOfUnderlying.valueOf(), 0);
      }
  });

  it("should exchange tokens", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency combination:
    var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}
    var currencyCombinations = [["DAI", "USDC"], ["DAI", "USDT"], ["USDC", "DAI"], ["USDC", "USDT"], ["USDT", "DAI"], ["USDT", "USDC"]];

    for (var i = 0; i < currencyCombinations.length; i++) {
      // Check source and destination wallet balances
      var inputErc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCombinations[0]]);
      var outputErc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCombinations[1]]);
      let oldInputBalance = await inputErc20Contract.balanceOf(RariFundManager.address).call();
      let oldOutputBalance = await outputErc20Contract.balanceOf(RariFundManager.address).call();

      // TODO: RariFundManager.fill0xOrdersUpTo
      // TODO: Ideally, we add actually call rari-fund-rebalancer

      // Check source and destination wallet balances
      let newInputBalance = await inputErc20Contract.balanceOf(RariFundManager.address).call();
      let newOutputBalance = await outputErc20Contract.balanceOf(RariFundManager.address).call();
      assert.equal(newInputBalance, 0);
      assert.atLeast(newOutputBalance, oldOutputBalance + (oldInputBalance * minMarginalOutputAmount));
    }
  });

  it("should set the interest rate, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeRate(uint256 rate)
    fundManagerInstance.setInterestFeeRate(1e18);

    // Check RariFundManager.getInterestFeeRate()
    let interestFeeRate = await fundManagerInstance.getInterestFeeRate().call();
    assert.equal(interestFeeRate.toNumber(), 1e18);

    // Check raw interest accrued
    let initialRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call(currencyCode);

    // Check interest fees generated
    let initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);

    // Wait for interest
    // TODO: Actually wait for interest and time out after 5 minutes
    setTimeout(function() {
      // For each currency:
      var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

      for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
        var currencyCode = Object.keys(erc20Contracts)[i];

        // Check raw interest accrued
        let nowRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call(currencyCode);
        assert.greater(nowRawInterestAccrued.valueOf(), initialRawInterestAccrued.valueOf());

        // Check interest fees generated
        // TODO: Exactly calculate expected fees generated (and remove multiplication of expected fees generated by 0.99)
        let nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);
        assert.atLeast(nowInterestFeesGenerated.valueOf(), initialInterestFeesGenerated.toNumber() + ((nowRawInterestAccrued.toNumber() - initialRawInterestAccrued.toNumber()) * 0.99));

        // Check initial balance
        var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
        let myOldBalance = await erc20Contract.balanceOf(accounts[0]).call();

        // claimFees(string currencyCode, address beneficiary)
        await fundManagerInstance.claimFees(currencyCode, accounts[0]);

        // Check that we claimed fees
        let myNewBalance = await erc20Contract.balanceOf(accounts[0]).call();
        assert.greater(myNewBalance, myOldBalance);
      }
    }, 5 * 60 * 1000);
  });

  it("should create a share of interest fees, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeShare(address beneficiary, uint256 shareProportion)
    await fundManagerInstance.setInterestFeeShare(accounts[1], 1e17);

    // TODO: Check _interestFeeShares[address].shareProportion (no way to do this as of now)

    // Check interest fees generated
    let initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);

    // Wait for interest
    // TODO: Actually wait for interest and time out after 5 minutes
    setTimeout(function() {
      // For each currency:
      var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

      for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
        var currencyCode = Object.keys(erc20Contracts)[i];

        // Check interest fees generated
        let nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);
        assert.greater(nowInterestFeesGenerated, initialInterestFeesGenerated);

        // Check initial balance
        var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
        let myOldBalance = erc20Contract.balanceOf(accounts[1]).call();

        // claimFees(string currencyCode, address beneficiary)
        await fundManagerInstance.claimFees(currencyCode, accounts[1]);

        // Check that we claimed fees
        // TODO: Exactly calculate expected fees generated (and remove multiplication of expected fees generated by 0.99)
        let myNewBalance = await erc20Contract.balanceOf(accounts[1]).call();
        assert.atLeast(myNewBalance.valueOf(), myOldBalance.toNumber() + ((nowInterestFeesGenerated.toNumber() - initialInterestFeesGenerated.toNumber()) * 0.1 * 0.99));
      }

      // Reset share proportion of interest fees to 0
      await fundManagerInstance.setInterestFeeShare(accounts[1], 0);
    }, 5 * 60 * 1000);
  });

  it("should set the master beneficiary of interest fees, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeMasterBeneficiary(address beneficiary)
    await fundManagerInstance.setInterestFeeMasterBeneficiary(accounts[1]);

    // TODO: Check _interestFeeMasterBeneficiary (no way to do this as of now)

    // Check interest fees generated
    let initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);

    // Wait for interest
    // TODO: Actually wait for interest and time out after 5 minutes
    setTimeout(function() {
      // For each currency:
      var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

      for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
        var currencyCode = Object.keys(erc20Contracts)[i];

        // Check interest fees generated
        let nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call(currencyCode);
        assert.greater(nowInterestFeesGenerated, initialInterestFeesGenerated);

        // Check initial balance
        var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
        let myOldBalance = erc20Contract.balanceOf(accounts[1]).call();

        // claimFees(string currencyCode, address beneficiary)
        await fundManagerInstance.claimFees(currencyCode, accounts[1]);

        // Check that we claimed fees
        // TODO: Exactly calculate expected fees generated (and remove multiplication of expected fees generated by 0.99)
        let myNewBalance = await erc20Contract.balanceOf(accounts[1]).call();
        assert.atLeast(myNewBalance.valueOf(), myOldBalance.toNumber() + ((nowInterestFeesGenerated.toNumber() - initialInterestFeesGenerated.toNumber()) * 0.1 * 0.99));
      }

      // Reset master beneficiary of interest fees
      await fundManagerInstance.setInterestFeeMasterBeneficiary(accounts[0]);
    }, 5 * 60 * 1000);
  });
});

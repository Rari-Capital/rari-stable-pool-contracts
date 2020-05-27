const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

contract("RariFundManager v0.2.0", async accounts => {
  it("should put upgrade the FundManager by withdrawing all tokens from all pools and transferring them as well as ETH to the new FundManager", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // Check balances in original FundManager
    var oldTokenBalances = {};
    for (const currencyCode of ["DAI", "USDC", "USDT"]) oldTokenBalances[currencyCode] = await fundManagerInstance.getRawTotalBalance.call(RariFundManager.address);
    let ethBalanceOld = await web3.eth.getBalance(RariFundManager.address);

    // Upgrade!
    await fundManagerInstance.upgradeFundManager(RariFundManager.address);

    // Check balances in new FundManager
    for (const currencyCode of ["DAI", "USDC", "USDT"]) {
      let newTokenBalance = await fundManagerInstance.getRawTotalBalance.call(RariFundManager.address);
      assert.equal(oldTokenBalances[currencyCode].valueOf(), newTokenBalance.valueOf());
    }

    let ethBalanceNew = await web3.eth.getBalance(RariFundManager.address);
    if (ethBalanceOld.valueOf() > 0) assert.greater(ethBalanceNew.valueOf(), 0);
  });

  it("should put upgrade the FundToken", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let newTokenInstance = await RariFundToken.deployed();

    // TODO: Create new FundToken (with changes) and copy balances

    // RariFundManager.setFundToken(address newContract)
    await fundManagerInstance.setFundToken(RariFundToken.address, { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundTokenContract
    // TODO: Check balances to make sure they're the same
  });

  it("should put upgrade the FundRebalancer", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setFundRebalancer(address newAddress)
    await fundManagerInstance.setFundRebalancer("0x0000000000000000000000000000000000000000", { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundRebalancerAddress
  });

  it("should disable and re-enable the fund", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.disableFund()
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled
    // TODO: Make sure we can't deposit or withdraw

    // RariFundManager.enableFund()
    await fundManagerInstance.enableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled
    // TODO: Make sure we can deposit and withdraw
  });

  it("should make a deposit, make a withdrawal, withdraw from pools, exchange tokens, and process pending withdrawals", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // TODO: Approve

    // TODO: RariFundManager.deposit
    await fundManagerInstance.deposit("0x0000000000000000000000000000000000000000", { from: accounts[0] });

    // TODO: Check RariFundManager.balanceOf(string currencyCode, address account)
    // TODO: Check RariFundManager.getTotalBalance(string currencyCode)
    // TODO: Check RariFundManager.getCombinedUsdBalance()
    // TODO: Check RariFundToken.balanceOf(address account)
    // TODO: RariFundManager.withdraw
    // TODO: Check RariFundManager.balanceOf(string currencyCode, address account)
    // TODO: Check RariFundManager.getTotalBalance(string currencyCode)
    // TODO: Check RariFundManager.getCombinedUsdBalance()
    // TODO: Check RariFundToken.balanceOf(address account)
  });

  it("should approve deposits to and deposit to pools", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // TODO: For each currency and for each pool:
    // TODO: Check source and destination pool balances
    // TODO: RariFundManager.approveToPool
    // TODO: RariFundManager.depositToPool
    // TODO: Check source and destination pool balances
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
        var oldBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying.call(RariFundManager.address);

        // RariFundManager.withdrawFromPool
        await fundManagerInstance.withdrawFromPool(i, pools[i][j], oldBalanceOfUnderlying, { from: accounts[0] });

        // Check new pool balance
        var newBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying.call(RariFundManager.address);
        assert.equal(oldBalanceOfUnderlying.valueOf(), newBalanceOfUnderlying.valueOf())
      }
  });

  it("should withdraw everything from all pools via RariFundManager.withdrawAllFromPool", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // For each currency and for each pool:
    var cErc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}
    var pools = [["DAI", "USDC"], ["DAI", "USDC", "USDT"]];

    for (var i = 0; i < pools.length; i++)
      for (var j = 0; i < pools[i].length; j++) {
        // Check initial pool balance
        var cErc20Contract = new this.web3.eth.Contract(cErc20DelegatorAbi, cErc20Contracts[pools[i][j]]);
        var oldBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying.call(RariFundManager.address);

        // RariFundManager.withdrawA;;FromPool
        await fundManagerInstance.withdrawAllFromPool(i, pools[i][j], { from: accounts[0] });

        // Check new pool balance
        var newBalanceOfUnderlying = await cErc20Contract.methods.balanceOfUnderlying.call(RariFundManager.address);
        assert.equal(oldBalanceOfUnderlying.valueOf(), newBalanceOfUnderlying.valueOf());
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
      let oldInputBalance = inputErc20Contract.balanceOf.call(RariFundManager.address);
      let oldOutputBalance = outputErc20Contract.balanceOf.call(RariFundManager.address);

      // TODO: RariFundManager.fill0xOrdersUpTo

      // Check source and destination wallet balances
      let newInputBalance = inputErc20Contract.balanceOf.call(RariFundManager.address);
      let newOutputBalance = outputErc20Contract.balanceOf.call(RariFundManager.address);
      assert.equal(newInputBalance.toNumber(), 0);
      assert.atLeast(newOutputBalance.toNumber(), oldOutputBalance.toNumber() + (oldInputBalance.toNumber() * minMarginalOutputAmount));
    }
  });

  it("should set the interest rate, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeRate(uint256 rate)
    fundManagerInstance.setInterestFeeRate(1e18);

    // Check RariFundManager.getInterestFeeRate()
    let interestFeeRate = await fundManagerInstance.getInterestFeeRate().call();
    assert.equal(interestFeeRate.toNumber(), 1e18);

    // TODO: Wait for interest

    // For each currency:
    var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

    for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
      var currencyCode = Object.keys(erc20Contracts)[i];

      // TODO: Check interest
      // TODO: Check fees

      // Check initial balance
      var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
      let myOldBalance = erc20Contract.balanceOf.call(accounts[0]);

      // claimFees(string currencyCode, address beneficiary)
      fundManagerInstance.claimFees(currencyCode, accounts[0]);

      // Check that we claimed fees
      let myNewBalance = erc20Contract.balanceOf.call(accounts[0]);
      assert.greater(myNewBalance.toNumber(), myOldBalance.toNumber());
    }
  });

  it("should create a share of interest fees, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeShare(address beneficiary, uint256 shareProportion)
    fundManagerInstance.setInterestFeeShare(accounts[0], 1e17);

    // TODO: Check share
    // TODO: Wait for interest

    // For each currency:
    var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

    for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
      var currencyCode = Object.keys(erc20Contracts)[i];

      // TODO: Check interest
      // TODO: Check fees

      // Check initial balance
      var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
      let myOldBalance = erc20Contract.balanceOf.call(accounts[0]);

      // claimFees(string currencyCode, address beneficiary)
      fundManagerInstance.claimFees(currencyCode, accounts[0]);

      // Check that we claimed fees
      let myNewBalance = erc20Contract.balanceOf.call(accounts[0]);
      assert.greater(myNewBalance.toNumber(), myOldBalance.toNumber());
    }
  });

  it("should set the master beneficiary of interest fees, wait for interest, and claim interest fees", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setInterestFeeMasterBeneficiary(address beneficiary)
    fundManagerInstance.setInterestFeeMasterBeneficiary(accounts[0]);

    // TODO: Check share
    // TODO: Wait for interest

    // For each currency:
    var erc20Contracts = { "DAI": "", "USDC": "", "USDT": ""}

    for (var i = 0; i < Object.keys(erc20Contracts).length; i++) {
      var currencyCode = Object.keys(erc20Contracts)[i];

      // TODO: Check interest
      // TODO: Check fees

      // Check initial balance
      var erc20Contract = new this.web3.eth.Contract(erc20Abi, erc20Contracts[currencyCode]);
      let myOldBalance = erc20Contract.balanceOf.call(accounts[0]);

      // claimFees(string currencyCode, address beneficiary)
      fundManagerInstance.claimFees(currencyCode, accounts[0]);

      // Check that we claimed fees
      let myNewBalance = erc20Contract.balanceOf.call(accounts[0]);
      assert.greater(myNewBalance.toNumber(), myOldBalance.toNumber());
    }
  });
});

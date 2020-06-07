const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager v0.3.0", accounts => {
  it("should upgrade the fund owner", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.transferOwnership()
    await fundManagerInstance.transferOwnership(accounts[1], { from: accounts[0] });

    // Test disabling and enabling the fund from the new owner address
    await fundManagerInstance.disableFund({ from: accounts[1] });
    await fundManagerInstance.enableFund({ from: accounts[1] });

    // Transfer ownership back
    await fundManagerInstance.transferOwnership(accounts[0], { from: accounts[1] });
  });

  it("should disable and re-enable the fund", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // RariFundManager.disableFund()
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)
    
    // Make sure we can't deposit or withdraw now (using DAI as an example)
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(1e17).toString()).send({ from: accounts[0] });
  
    try {
      await fundManagerInstance.deposit("DAI", web3.utils.toBN(1e17), { from: accounts[0] });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "Deposits to and withdrawals from the fund are currently disabled.");
    }
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    try {
      await fundManagerInstance.withdraw("DAI", web3.utils.toBN(1e17), { from: accounts[0] });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "Deposits to and withdrawals from the fund are currently disabled.");
    }

    // RariFundManager.enableFund()
    await fundManagerInstance.enableFund({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Make sure we can deposit and withdraw now (using DAI as an example)
    let myOldBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    await fundManagerInstance.deposit("DAI", web3.utils.toBN(1e17), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostDepositBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert(myPostDepositBalance.gte(myOldBalance.add(web3.utils.toBN(1e17))));
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundManagerInstance.withdraw("DAI", web3.utils.toBN(1e17), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myNewBalance = await fundManagerInstance.usdBalanceOf.call(accounts[0]);
    assert(myNewBalance.lt(myPostDepositBalance));
  });

  it("should put upgrade the FundRebalancer", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // RariFundManager.setFundRebalancer(address newAddress)
    await fundManagerInstance.setFundRebalancer(accounts[1], { from: accounts[0] });

    // TODO: Check RariFundManager._rariFundRebalancerAddress (no way to do this as of now)

    // Test fund rebalancer functions from the second account
    // TODO: Ideally, we actually test the fund rebalancer itself
    await fundManagerInstance.setAcceptedCurrency("DAI", false, { from: accounts[1] });
    await fundManagerInstance.setAcceptedCurrency("DAI", true, { from: accounts[1] });

    // Reset fund rebalancer address
    await fundManagerInstance.setFundRebalancer(accounts[0], { from: accounts[0] });
  });
  
  it("should put upgrade the FundManager by disabling the old contract, withdrawing all tokens from all pools, transferring them to the new FundManager, and passing data to the new FundManager", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundManagerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundManagerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Check balances in original FundManager
    var oldTokenBalances = {};
    for (const currencyCode of Object.keys(currencies)) oldTokenBalances[currencyCode] = await fundManagerInstance.getTotalBalance.call(currencyCode);

    // Create new FundManager
    // TODO: Test that we can make changes to the code of the new fund manager before deploying it and upgrading to it
    var newFundManagerInstance = await RariFundManager.new({ from: accounts[0] });

    // Disable original FundManager
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Upgrade!
    await newFundManagerInstance.authorizeFundManagerDataSource(fundManagerInstance.address);
    await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address);
    await newFundManagerInstance.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");

    // Check balances in new FundManager
    for (const currencyCode of Object.keys(currencies)) {
      let newTokenBalance = await newFundManagerInstance.getTotalBalance.call(currencyCode);
      assert(newTokenBalance.gte(oldTokenBalances[currencyCode]));
    }
  });

  // Disabled for now as we do not yet have an upgrade function on the token because it will only be necessary on a future upgrade
  /* it("should put upgrade the FundToken", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await RariFundToken.deployed();

    // Create new FundToken
    // TODO: Test that we can make changes to the code of the new fund token before deploying it and upgrading to it
    var newFundTokenInstance = await RariFundToken.new({ from: accounts[0] });

    // Copy balances from the old to the new FundToken
    // TODO: Actually pull the token holders from somewhere (how do we get an ERC20 token balance list automatically?)
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
      var balance = await newFundTokenInstance.balanceOf.call(tokenHolders[i]);
      assert(tokenBalances[i].eq(balance));
    }
  }); */
});

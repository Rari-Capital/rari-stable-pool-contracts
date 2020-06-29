const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

const RariFundManager = artifacts.require("RariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager", accounts => {
  it("should make deposits until the default (global) account balance limit is hit", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(1e18);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Check account balance
    let accountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });

    // Keep depositing until we hit the limit (if we pass the limit, fail)
    while (accountBalance.lte(defaultAccountBalanceLimitUsdBN)) {
      try {
        await fundManagerInstance.deposit("DAI", depositAmountBN, { from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });
      } catch (error) {
        assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
        assert(accountBalance.add(depositAmountBN).gt(defaultAccountBalanceLimitUsdBN));
        return;
      }
      
      accountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    }

    assert.fail();

    // Withdraw all for next test
    await fundManagerInstance.withdraw("DAI", accountBalance, { from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });
  });
  
  it("should make deposits until the individual account balance limit is hit", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(5e17);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    // Set individual account balance limit
    var individualAccountBalanceLimitUsdBN = web3.utils.toBN(1e18);
    await fundManagerInstance.setIndividualAccountBalanceLimit(accounts[1], individualAccountBalanceLimitUsdBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Check account balance
    let accountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });

    // Keep depositing until we hit the limit (if we pass the limit, fail)
    while (accountBalance.lte(individualAccountBalanceLimitUsdBN)) {
      try {
        await fundManagerInstance.deposit("DAI", depositAmountBN, { from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });
      } catch (error) {
        assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
        assert(accountBalance.add(depositAmountBN).gt(individualAccountBalanceLimitUsdBN));
        return;
      }
      
      accountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    }

    assert.fail();

    // Withdraw all for next test
    await fundManagerInstance.withdraw("DAI", accountBalance, { from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });
  });
  
  it("should make no deposits due to an individual account balance limit of 0", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Set default account balance limit
    var defaultAccountBalanceLimitUsdBN = web3.utils.toBN(5e17);
    await fundManagerInstance.setDefaultAccountBalanceLimit(defaultAccountBalanceLimitUsdBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    // To set individual account balance limit of 0, use -1 instead (0 means use default limit)
    await fundManagerInstance.setIndividualAccountBalanceLimit(accounts[1], web3.utils.toBN(-1), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Use DAI as an example for depositing
    var depositAmountBN = web3.utils.toBN(1e17);
    
    // Approve tokens to RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)).toString()).send({ from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });

    // Try to deposit
    try {
      await fundManagerInstance.deposit("DAI", depositAmountBN, { from: accounts[1], nonce: await web3.eth.getTransactionCount(accounts[1]) });
    } catch (error) {
      assert.include(error.message, "Making this deposit would cause the balance of this account to exceed the maximum.");
      return;
    }

    assert.fail();
  });
});

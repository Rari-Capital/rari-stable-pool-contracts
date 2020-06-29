const fs = require('fs');

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');

// To compile DummyRariFundManager, run the following command using solc-js v0.5.17
// solcjs DummyRariFundManager.sol --abi --bin
const dummyRariFundManagerAbi = JSON.parse(fs.readFileSync(__dirname + '/fixtures/DummyRariFundManager_sol_DummyRariFundManager.abi'));
const dummyRariFundManagerBin = fs.readFileSync(__dirname + '/fixtures/DummyRariFundManager_sol_DummyRariFundManager.bin');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager", accounts => {
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
    
    // Use DAI as an example and set amount to deposit/withdraw
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var amountUsdBN = 18 >= currencies[currencyCode].decimals ? amountBN.mul(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : amountBN.div(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));
    
    // Make sure we can't deposit or withdraw now (using DAI as an example)
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
  
    try {
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    try {
      await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0] });
      assert.fail();
    } catch (error) {
      assert.include(error.message, "This fund manager contract is disabled. This may be due to an upgrade.");
    }

    // RariFundManager.enableFund()
    await fundManagerInstance.enableFund({ from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Make sure we can deposit and withdraw now (using DAI as an example)
    let myInitialBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostDepositBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myPostDepositBalance.gte(myInitialBalance.add(amountUsdBN)));
    
    await fundTokenInstance.approve(RariFundManager.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1)), { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundManagerInstance.withdraw(currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    let myPostWithdrawalBalance = await fundManagerInstance.balanceOf.call(accounts[0]);
    assert(myPostWithdrawalBalance.lt(myPostDepositBalance));
  });

  it("should transfer ETH to the fund manager and withdraw it to the owner", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Check initial ETH balance of RariFundManager
    let initialBalance = web3.utils.toBN(await web3.eth.getBalance(RariFundManager.address));
    
    // Transfer ETH to RariFundManager
    var amountBN = web3.utils.toBN(1e15);
    await fundManagerInstance.send(amountBN, { from: accounts[0] });
    
    // Check post-deposit ETH balance of RariFundManager
    let postDepositBalance = web3.utils.toBN(await web3.eth.getBalance(RariFundManager.address));
    assert(postDepositBalance.eq(initialBalance.add(amountBN)));
    
    // Transfer ETH from RariFundManager
    await fundManagerInstance.ownerWithdraw("ETH", { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    // Check post-withdrawal ETH balance of RariFundManager
    let postWithdrawalBalance = web3.utils.toBN(await web3.eth.getBalance(RariFundManager.address));
    assert(postWithdrawalBalance.isZero());
  });

  it("should transfer COMP to the fund manager and withdraw it to the owner", async () => {
    let fundManagerInstance = await RariFundManager.deployed();

    // Check initial COMP balance of RariFundManager
    var erc20Contract = new web3.eth.Contract(erc20Abi, "0xc00e94Cb662C3520282E6f5717214004A7f26888");
    let initialBalance = web3.utils.toBN(await erc20Contract.methods.balanceOf(RariFundManager.address).call());
    
    // Transfer COMP to RariFundManager
    var amountBN = web3.utils.toBN(1e18);
    await erc20Contract.methods.transfer(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    
    // Check post-deposit COMP balance of RariFundManager
    let postDepositBalance = web3.utils.toBN(await erc20Contract.methods.balanceOf(RariFundManager.address).call());
    assert(postDepositBalance.eq(initialBalance.add(amountBN)));
    
    // Transfer COMP from RariFundManager
    await fundManagerInstance.ownerWithdraw("COMP", { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    
    // Check post-withdrawal COMP balance of RariFundManager
    let postWithdrawalBalance = web3.utils.toBN(await erc20Contract.methods.balanceOf(RariFundManager.address).call());
    assert(postWithdrawalBalance.isZero());
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
});

contract("RariFundManager", accounts => {
  it("should put upgrade the FundManager to a copy of its code by disabling the old contract, withdrawing all tokens from all pools, transferring them to the new FundManager, and passing data to the new FundManager", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundManagerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundManagerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Check balance of original FundManager
    var oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    var oldFundBalance = await fundManagerInstance.getFundBalance.call();
    var oldAccountBalance = await fundManagerInstance.balanceOf.call(accounts[0]);

    // Disable original FundManager
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundManager
    var newFundManagerInstance = await RariFundManager.new({ from: accounts[0] });
    await newFundManagerInstance.setFundToken(RariFundToken.address, { from: accounts[0] });

    // Upgrade!
    await newFundManagerInstance.authorizeFundManagerDataSource(fundManagerInstance.address);
    await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address);
    await newFundManagerInstance.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000");

    // Check balance of new FundManager
    let newRawFundBalance = await newFundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance));
    let newFundBalance = await newFundManagerInstance.getFundBalance.call();
    assert(newFundBalance.gte(oldFundBalance));
    let newAccountBalance = await newFundManagerInstance.balanceOf.call(accounts[0]);
    assert(newAccountBalance.gte(oldAccountBalance));
  });
});

contract("RariFundManager", accounts => {
  it("should put upgrade the FundManager to new code by disabling the old contract, withdrawing all tokens from all pools, transferring them to the new FundManager, and passing data to the new FundManager", async () => {
    let fundManagerInstance = await RariFundManager.deployed();
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var amountBN = web3.utils.toBN(10 ** (currencies["DAI"].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies["DAI"].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit("DAI", amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundManagerInstance.approveToPool(1, "DAI", amountBN, { from: accounts[0] });
    await fundManagerInstance.depositToPool(1, "DAI", amountBN, { from: accounts[0] });

    // Disable original FundManager
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // TODO: Check _fundDisabled (no way to do this as of now)

    // Create new FundManager
    let newFundManagerWeb3Instance = new web3.eth.Contract(dummyRariFundManagerAbi);
    newFundManagerWeb3Instance = await newFundManagerWeb3Instance.deploy({ data: "0x" + dummyRariFundManagerBin }).send({ from: accounts[0] });

    // Upgrade!
    await newFundManagerWeb3Instance.methods.authorizeFundManagerDataSource(fundManagerInstance.address).send({ from: accounts[0] });
    await fundManagerInstance.upgradeFundManager(newFundManagerWeb3Instance.options.address);
    await newFundManagerWeb3Instance.methods.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000").send({ from: accounts[0] });
  });
});

contract("RariFundToken", accounts => {
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

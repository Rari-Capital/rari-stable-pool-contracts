const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundController", accounts => {
  it("should put upgrade the FundController with funds in all pools in all currencies without using too much gas", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();

    // Check balance before deposits
    let oldRawFundBalance = await fundManagerInstance.getRawFundBalance.call();

    // Tally up USD deposited
    var totalUsdBN = web3.utils.toBN(0);
    
    // For each currency of each pool, deposit to fund and deposit to pool
    for (const poolName of Object.keys(pools)) for (const currencyCode of Object.keys(pools[poolName].currencies)) {
      // Approve and deposit tokens to the fund (using DAI as an example)
      var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
      totalUsdBN.iadd(web3.utils.toBN(1e17));
      var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
      await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
      await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });

      // Approve and deposit to pool (using Compound as an example)
      await fundControllerInstance.approveToPool(poolName === "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
      await fundControllerInstance.depositToPool(poolName === "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
    }

    // Disable original FundController and FundManager
    await fundControllerInstance.disableFund({ from: accounts[0] });
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // Create new FundController and set its FundManager
    var newFundControllerInstance = await RariFundController.new({ from: accounts[0] });
    await newFundControllerInstance.setFundManager(RariFundManager.address, { from: accounts[0] });

    // Upgrade!
    var result = await fundManagerInstance.setFundController(newFundControllerInstance.address, { from: accounts[0] });
    console.log("Gas usage of RariFundManager.setFundController:", result.receipt.gasUsed);
    assert.isAtMost(result.receipt.gasUsed, 5000000); // Assert it uses no more than 5 million gas

    // Check balance of new FundManager
    let newRawFundBalance = await fundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance.add(totalUsdBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
  });
});

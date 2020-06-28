const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");

// These tests expect the owner and the fund rebalancer of RariFundManager to be set to accounts[0]
contract("RariFundManager v0.3.0", accounts => {
  it("should put upgrade the FundManager with funds in all pools in all currencies without using too much gas", async () => {
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
      await fundManagerInstance.approveToPool(poolName === "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
      await fundManagerInstance.depositToPool(poolName === "Compound" ? 1 : 0, currencyCode, amountBN, { from: accounts[0] });
    }

    // Disable original FundManager
    await fundManagerInstance.disableFund({ from: accounts[0] });

    // Create new FundManager
    var newFundManagerInstance = await RariFundManager.new({ from: accounts[0] });
    await newFundManagerInstance.setFundToken(RariFundToken.address, { from: accounts[0] });

    // Upgrade!
    await newFundManagerInstance.authorizeFundManagerDataSource(fundManagerInstance.address, { from: accounts[0] });
    var result = await fundManagerInstance.upgradeFundManager(newFundManagerInstance.address, { from: accounts[0] });
    assert.isAtMost(result.receipt.gasUsed, 5000000); // Assert it uses no more than 5 million gas
    await newFundManagerInstance.authorizeFundManagerDataSource("0x0000000000000000000000000000000000000000", { from: accounts[0] });

    // Check balance of new FundManager
    let newRawFundBalance = await newFundManagerInstance.getRawFundBalance.call();
    assert(newRawFundBalance.gte(oldRawFundBalance.add(amountBN.mul(web3.utils.toBN(9999)).div(web3.utils.toBN(10000)))));
  });
});

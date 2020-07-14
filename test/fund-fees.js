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

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to accounts[0]
contract("RariFundManager", accounts => {
  it("should deposit to pools, set the interest fee rate, wait for interest, set the master beneficiary of interest fees, deposit fees, wait for interest again, and withdraw fees", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    
    // Approve and deposit tokens to the fund (using DAI as an example)
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: accounts[0] });
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: accounts[0] });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });
    await fundControllerInstance.depositToPool(1, currencyCode, amountBN, { from: accounts[0], nonce: await web3.eth.getTransactionCount(accounts[0]) });

    // Set interest fee rate
    await fundManagerInstance.setInterestFeeRate(web3.utils.toBN(1e17), { from: accounts[0] });

    // Check interest fee rate
    let interestFeeRate = await fundManagerInstance.getInterestFeeRate.call();
    assert(interestFeeRate.eq(web3.utils.toBN(1e17)));

    // Check initial raw interest accrued, interest accrued, and interest fees generated
    let initialRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    let initialInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    let initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();

    // Force accrue interest
    await forceAccrueCompound(currencyCode, accounts[0]);
    
    // Check raw interest accrued, interest accrued, and interest fees generated
    let nowRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    assert(nowRawInterestAccrued.gt(initialRawInterestAccrued));
    let nowInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    assert(nowInterestAccrued.gt(initialInterestAccrued));
    let nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();
    assert(nowInterestFeesGenerated.gte(initialInterestFeesGenerated.add(nowRawInterestAccrued.sub(initialRawInterestAccrued).divn(10))));

    // Set the master beneficiary of interest fees
    await fundManagerInstance.setInterestFeeMasterBeneficiary(accounts[1], { from: accounts[0] });

    // TODO: Check _interestFeeMasterBeneficiary (no way to do this as of now)

    // Check initial balances
    let initialAccountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    let initialFundBalance = await fundManagerInstance.getFundBalance.call();
    let initialRftBalance = await fundTokenInstance.balanceOf.call(accounts[1]);

    // Deposit fees back into the fund!
    await fundManagerInstance.depositFees({ from: accounts[0] });

    // Check that we claimed fees
    let postDepositAccountBalance = await fundManagerInstance.balanceOf.call(accounts[1]);
    assert(postDepositAccountBalance.gte(initialAccountBalance.add(nowInterestFeesGenerated.sub(initialInterestFeesGenerated))));
    let postDepositFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(postDepositFundBalance.gte(initialFundBalance.add(nowInterestFeesGenerated.sub(initialInterestFeesGenerated))));
    let postDepositRftBalance = await fundTokenInstance.balanceOf.call(accounts[1]);
    assert(postDepositRftBalance.gt(initialRftBalance));

    // Check initial raw interest accrued, interest accrued, and interest fees generated
    initialRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    initialInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();

    // Force accrue interest
    await forceAccrueCompound(currencyCode, accounts[0]);

    // Check raw interest accrued, interest accrued, and interest fees generated
    nowRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    assert(nowRawInterestAccrued.gt(initialRawInterestAccrued));
    nowInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    assert(nowInterestAccrued.gt(initialInterestAccrued));
    nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();
    assert(nowInterestFeesGenerated.gte(initialInterestFeesGenerated.add(nowRawInterestAccrued.sub(initialRawInterestAccrued).divn(10))));

    // Check initial account balance
    let myOldBalanceBN = web3.utils.toBN(await erc20Contract.methods.balanceOf(accounts[1]).call());

    // Withdraw from pool and withdraw fees!
    // TODO: Withdraw exact amount from pool instead of simply withdrawing all
    await fundControllerInstance.withdrawAllFromPool(1, currencyCode, { from: accounts[0] });
    await fundManagerInstance.withdrawFees(currencyCode, { from: accounts[0] });

    // Check that we claimed fees
    let myNewBalanceBN = web3.utils.toBN(await erc20Contract.methods.balanceOf(accounts[1]).call());
    var expectedGainUsdBN = nowInterestFeesGenerated.sub(initialInterestFeesGenerated);
    var expectedGainBN = 18 >= currencies[currencyCode].decimals ? expectedGainUsdBN.div(web3.utils.toBN(10 ** (18 - currencies[currencyCode].decimals))) : expectedGainUsdBN.mul(web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 18)));
    assert(myNewBalanceBN.gte(myOldBalanceBN.add(expectedGainBN)));

    // Reset master beneficiary of interest fees
    await fundManagerInstance.setInterestFeeMasterBeneficiary(accounts[0], { from: accounts[0] });
  });
});

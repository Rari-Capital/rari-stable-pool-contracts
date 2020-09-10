/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public APIs (described in `API.md` of the `rari-contracts` package) of the official smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license) benefitting Rari Capital, Inc.
 * Only those with explicit permission from a co-founder of Rari Capital (Jai Bhavnani, Jack Lipstone, or David Lucid) are permitted to study, review, or analyze any part of the source code contained in the `rari-contracts` package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in the `rari-contracts` package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

const erc20Abi = require('./abi/ERC20.json');

const currencies = require('./fixtures/currencies.json');
const pools = require('./fixtures/pools.json');

const RariFundController = artifacts.require("RariFundController");
const RariFundManager = artifacts.require("RariFundManager");
const RariFundToken = artifacts.require("RariFundToken");
const RariFundPriceConsumer = artifacts.require("RariFundPriceConsumer");

// These tests expect the owner and the fund rebalancer of RariFundController and RariFundManager to be set to process.env.DEVELOPMENT_ADDRESS
contract("RariFundManager", accounts => {
  it("should deposit to pools, set the interest fee rate, wait for interest, set the master beneficiary of interest fees, deposit fees, wait for interest again, and withdraw fees", async () => {
    let fundControllerInstance = await RariFundController.deployed();
    let fundManagerInstance = await RariFundManager.deployed();
    let fundTokenInstance = await (parseInt(process.env.UPGRADE_FROM_LAST_VERSION) > 0 ? RariFundToken.at(process.env.UPGRADE_FUND_TOKEN) : RariFundToken.deployed());
    let fundPriceConsumerInstance = await RariFundPriceConsumer.deployed();

    // Approve and deposit tokens to the fund (using DAI as an example)
    var currencyCode = "DAI";
    var amountBN = web3.utils.toBN(10 ** (currencies[currencyCode].decimals - 1));
    var erc20Contract = new web3.eth.Contract(erc20Abi, currencies[currencyCode].tokenAddress);
    await erc20Contract.methods.approve(RariFundManager.address, amountBN.toString()).send({ from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.deposit(currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS });

    // Approve and deposit to pool (using Compound as an example)
    await fundControllerInstance.approveToPool(1, currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });
    await fundControllerInstance.depositToPool(1, currencyCode, amountBN, { from: process.env.DEVELOPMENT_ADDRESS, nonce: await web3.eth.getTransactionCount(process.env.DEVELOPMENT_ADDRESS) });

    // Set interest fee rate
    await fundManagerInstance.setInterestFeeRate(web3.utils.toBN(1e17), { from: process.env.DEVELOPMENT_ADDRESS });

    // Check interest fee rate
    let interestFeeRate = await fundManagerInstance.getInterestFeeRate.call();
    assert(interestFeeRate.eq(web3.utils.toBN(1e17)));

    // Check initial raw interest accrued, interest accrued, and interest fees generated
    let initialRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    let initialInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    let initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();

    // Force accrue interest
    await new Promise(resolve => setTimeout(resolve, 1000));
    await web3.eth.sendTransaction({ from: process.env.DEVELOPMENT_ADDRESS, to: process.env.DEVELOPMENT_ADDRESS, value: 0 });
    
    // Check raw interest accrued, interest accrued, and interest fees generated
    let nowRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    assert(nowRawInterestAccrued.gt(initialRawInterestAccrued));
    let nowInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    assert(nowInterestAccrued.gt(initialInterestAccrued));
    let nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();
    assert(nowInterestFeesGenerated.gte(initialInterestFeesGenerated.add(nowRawInterestAccrued.sub(initialRawInterestAccrued).divn(10))));

    // Set the master beneficiary of interest fees
    await fundManagerInstance.setInterestFeeMasterBeneficiary(process.env.DEVELOPMENT_ADDRESS_SECONDARY, { from: process.env.DEVELOPMENT_ADDRESS });

    // TODO: Check _interestFeeMasterBeneficiary (no way to do this as of now)

    // Check initial balances
    let initialAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    let initialFundBalance = await fundManagerInstance.getFundBalance.call();
    let initialRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);

    // Deposit fees back into the fund!
    await fundManagerInstance.depositFees({ from: process.env.DEVELOPMENT_ADDRESS });

    // Check that we claimed fees
    let postDepositAccountBalance = await fundManagerInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    assert(postDepositAccountBalance.gte(initialAccountBalance.add(nowInterestFeesGenerated.sub(initialInterestFeesGenerated))));
    let postDepositFundBalance = await fundManagerInstance.getFundBalance.call();
    assert(postDepositFundBalance.gte(initialFundBalance.add(nowInterestFeesGenerated.sub(initialInterestFeesGenerated))));
    let postDepositRftBalance = await fundTokenInstance.balanceOf.call(process.env.DEVELOPMENT_ADDRESS_SECONDARY);
    assert(postDepositRftBalance.gt(initialRftBalance));

    // Check initial raw interest accrued, interest accrued, and interest fees generated
    initialRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    initialInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    initialInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();

    // Force accrue interest
    await new Promise(resolve => setTimeout(resolve, 1000));
    await web3.eth.sendTransaction({ from: process.env.DEVELOPMENT_ADDRESS, to: process.env.DEVELOPMENT_ADDRESS, value: 0 });

    // Check raw interest accrued, interest accrued, and interest fees generated
    nowRawInterestAccrued = await fundManagerInstance.getRawInterestAccrued.call();
    assert(nowRawInterestAccrued.gt(initialRawInterestAccrued));
    nowInterestAccrued = await fundManagerInstance.getInterestAccrued.call();
    assert(nowInterestAccrued.gt(initialInterestAccrued));
    nowInterestFeesGenerated = await fundManagerInstance.getInterestFeesGenerated.call();
    assert(nowInterestFeesGenerated.gte(initialInterestFeesGenerated.add(nowRawInterestAccrued.sub(initialRawInterestAccrued).divn(10))));

    // Check initial account balance
    let myOldBalanceBN = web3.utils.toBN(await erc20Contract.methods.balanceOf(process.env.DEVELOPMENT_ADDRESS_SECONDARY).call());

    // Withdraw from pool and withdraw fees!
    // TODO: Withdraw exact amount from pool instead of simply withdrawing all
    await fundControllerInstance.withdrawAllFromPool(1, currencyCode, { from: process.env.DEVELOPMENT_ADDRESS });
    await fundManagerInstance.withdrawFees(currencyCode, { from: process.env.DEVELOPMENT_ADDRESS });

    // Check that we claimed fees
    let myNewBalanceBN = web3.utils.toBN(await erc20Contract.methods.balanceOf(process.env.DEVELOPMENT_ADDRESS_SECONDARY).call());
    var expectedGainUsdBN = nowInterestFeesGenerated.sub(initialInterestFeesGenerated);
    var currencyPricesInUsd = await fundPriceConsumerInstance.getCurrencyPricesInUsd.call();
    var expectedGainBN = expectedGainUsdBN.mul(web3.utils.toBN(10 ** currencies[currencyCode].decimals)).div(currencyPricesInUsd[Object.keys(currencies).indexOf(currencyCode)]);
    assert(myNewBalanceBN.gte(myOldBalanceBN.add(expectedGainBN)));

    // Reset master beneficiary of interest fees
    await fundManagerInstance.setInterestFeeMasterBeneficiary(process.env.DEVELOPMENT_ADDRESS, { from: process.env.DEVELOPMENT_ADDRESS });
  });
});

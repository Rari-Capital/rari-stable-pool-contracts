# Rari Stable Pool: How it Works

This document explains how the fund and the software work under the hood. This content is also available [on our website](https://rari.capital/current.html).

## RSPT (Rari Stable Pool Token)

Each user's share of the fund is determined by their RSPT balance. When you deposit funds to Rari, an equivalent amount of RSPT (Rari Stable Pool Token) is minted to your account. When you withdraw funds to Rari, the equivalent amount of RSPT is burned from your account. As soon as you deposit, you start earning yield. Essentially, fund holdings and yield are split up proportionally across RSPT holders by their USD balances.

## Generating Yield

Currently, Rari generates yield by depositing a combination of:

* DAI and USDC to the lending protocol [dYdX](https://dydx.exchange/)
* DAI, USDC, and USDT to the lending protocol [Compound](https://compound.finance/)
* DAI, USDC, USDT, TUSD, BUSD, and sUSD to the lending protocol [Aave](https://aave.com/)
* mUSD to the savings protocol from [mStable](https://mstable.org/)

Rari optimizes yield not only by allocating assets to the pools with the highest interest rates, but also by exchanging assets to the stablecoins with the highest interest rates via a combination of:

* the [0x](https://0x.org/) exchange
* swapping via mUSD from [mStable](https://mstable.org)

In the near future, we will be generating yield from more currencies across more lending protocols, among other strategies.

## Deposits

Only certain stablecoins are accepted for direct deposits (direct meaning without exchange to an accepted currency). When depositing one of these stablecoins, the Rari web client approves tokens to `RariFundManager` and calls `RariFundManager.deposit(string currencyCode, uint256 amount)`. When you deposit another currency, the Rari web client approves tokens to `RariFundProxy` and calls `RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)` to exchange your tokens via [0x](https://0x.org/) and/or `RariFundProxy.exchangeAndDeposit(string inputCurrencyCode, uint256 inputAmount, string outputCurrencyCode)` to exchange your tokens via [mStable](https://mstable.org) and then deposit them (please be aware that exchanges via 0x are subject to slippage due to price spread, 0x charges an ETH protocol fee, and mStable charges a small denominational percentage fee, but can avoid slippage and even get you a bonus). See `USAGE.md` for more information on how to deposit via the smart contracts and `API.md` for a detailed reference on our public smart contract methods.

## Withdrawals

Just like only certain stablecoins are accepted for direct deposits, only stablecoins held by the fund are availble for direct withdrawals. When withdrawing one of these stablecoins, the Rari web client approves RSPT to `RariFundManager` and calls `RariFundManager.withdraw(string currencyCode, uint256 amount)`. When you withdraw another currency, the Rari web client approves RSPT to `RariFundProxy` and calls `RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)` to withdraw your tokens and then exchange them via [0x](https://0x.org/) and/or [mStable](https://mstable.org) (please be aware that exchanges via 0x are subject to slippage due to price spread, 0x charges an ETH protocol fee, and mStable charges a small denominational percentage fee, but can avoid slippage and even get you a bonus). See `USAGE.md` for more information on how to deposit via the smart contracts and `API.md` for a detailed reference on our public smart contract methods.

## Structure

We have 4 user-facing **smart contracts** in total (see `DEPLOYED.md` for deployed addresses):

* `RariFundManager` is the fund's main contract: it handles direct deposits and withdrawals, USD balances, interest, fees, etc.
* `RariFundController` holds all assets and is used by the rebalancer to deposit and withdraw from pools and make exchanges.
* `RariFundToken` is the contract powering the Rari Stable Pool Token (RSPT), an ERC20 token used to internally account for the ownership of the fund's assets under management (AUM).
* `RariFundProxy` includes wrapper functions built on top of RariFundManager: exchange and deposit, withdraw and exchange, and deposit without paying gas via the Gas Station Network (GSN).

A **centralized rebalancer** controls which pools hold which currencies at any given time but only has permission to move funds between pools and exchange currencies, not withdraw funds elsewhere.

## Security

Rari's Ethereum-based smart contracts are written in Solidity and reviewed by multiple partners for security. Rari does not have control over your funds: instead, the Ethereum blockchain executes all secure code across its entire decentralized network (making it very difficult and extremely costly to rewrite history), and your funds are only withdrawable by you.

While the centralized rebalancer does have control over which pools hold which currencies at any given time but only has permission to move funds between pools and exchange currencies, not withdraw funds elsewhere. Losses due to exchange slippage in a 24-hour period are limited proportionally to the fund balance for security since 0x orders can come from anywhere. However, the rebalancer can approve any amount of funds to the pools and exchanges integrated.

Please note that at the moment, smart contract upgrades are approved via a 3-of-5 multisig federation controlled by Rari's co-founders and partners. However, upgrades will become decentralized in the future via a governance protocol based on a new token.

Please note that using our web client online at [app.rari.capital](https://app.rari.capital) is not nearly as trustworthy as downloading, verifying, and using it offline. Lastly, the rebalancer is centralized, but it can only rebalance funds to different currencies and pools. In the near future, we will be implementing a smart-contract-based (and therefore decentralized) slippage limit.

## Risk

We have covered security above, but see [our website](https://rari.capital/risks.html) for more information on all risks present in the product and its software.

## Performance Fee

A 20% performance fee is deducted from all interest earned by RSPT holders. This fee is liable to change in the future, but fees on past interest cannot be changed.

## COMP

All [COMP (Compound's governance token)](https://compound.finance/governance/comp) earned by the fund is liquidated into additional interest for RSPT holders every 3 days.

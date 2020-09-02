# How the Rari Capital Stablecoin Fund Works

This document explains how the fund and the software work under the hood. This content is also available [on our website](https://rari.capital/current.html).

## RFT (Rari Fund Token)

Each user's share of the fund is determined by their RFT balance. When you deposit funds to Rari, an equivalent amount of RFT (Rari Fund Token) is minted to your account. When you withdraw funds to Rari, the equivalent amount of RFT is burned from your account. As soon as you deposit, you start earning yield. Essentially, fund holdings and yield are split up proportionally across RFT holders by their USD balances.

## Generating Yield

Currently, Rari generates yield by depositing a combination of DAI and USDC to the lending protocol [dYdX](https://dydx.exchange/) as well as DAI, USDC, and USDT to the lending protocol [Compound](https://compound.finance/). In the near future, we will be generating yield from more currencies across more lending protocols, among other strategies.

## Deposits

Only certain stablecoins are accepted for direct deposits (direct meaning without exchange to an accepted currency). When depositing one of these stablecoins, the Rari web client approves tokens to `RariFundManager` and calls `RariFundManager.deposit(string currencyCode, uint256 amount)`. When you deposit another currency, the Rari web client approves tokens to `RariFundProxy` and calls `RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)` to exchange your tokens via [0x](https://0x.org/) and then deposit them (please be aware that 0x charges an ETH protocol fee).

## Withdrawals

Just like only certain stablecoins are accepted for direct deposits, only stablecoins held by the fund are availble for direct withdrawals. When withdrawing one of these stablecoins, the Rari web client approves RFT to `RariFundManager` and calls `RariFundManager.withdraw(string currencyCode, uint256 amount)`. When you withdraw another currency, the Rari web client approves RFT to `RariFundProxy` and calls `RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)` to withdraw your tokens and then exchange them via [0x](https://0x.org/) (please be aware that 0x charges an ETH protocol fee).

## Security

Rari's Ethereum-based smart contracts are written in Solidity and reviewed by multiple partners for security. Rari does not have control over your funds: instead, the Ethereum blockchain executes all secure code across its entire decentralized network (making it very difficult and extremely costly to rewrite history), and your funds are only withdrawable by you (or an upgrade of `RariFundManager`). However, upgrades will become decentralized in the future via a governance protocol based on a new token. Please note that using our web client online at [app.rari.capital](https://app.rari.capital) is not nearly as trustworthy as downloading, verifying, and using it offline. Lastly, the rebalancer is centralized, but it can only rebalance funds to different currencies and pools. In the near future, we will be implementing a smart-contract-based (and therefore decentralized) slippage limit.

## Smart Contract Structure

`RariFundManager` handles deposits and withdrawals to the fund, as well as all other external functions, other than `RariFundToken`'s functions as well as the `exchangeAndDeposit` and `withdrawAndExchange` functions of `RariFundProxy` (see **Deposits** and **Withdrawals** above for more information on RariFundProxy). `RariFundManager` depends on the external library `RariFundController` (a library useful only to RariFundManager).

## Performance Fee

A 20% performance fee is deducted from all interest earned by RFT holders. This fee is liable to change in the future, but fees on past interest cannot be changed.

## COMP

All [COMP (Compound's governance token)](https://compound.finance/governance/comp) earned by the fund is liquidated into additional interest for RFT holders every 3 days.

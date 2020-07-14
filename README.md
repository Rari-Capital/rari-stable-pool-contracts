# Rari Capital Contracts & dApp

Welcome to `rari-contracts`, the central repository for the Solidity source code behind Rari Capital's Ethereum-based smart contracts (with automated tests), our quantitative fund's dApp (web client), and the documentation for it all.

## Using the contracts

API documentation for our smart contracts is available in `API.md`.

## How it works

Documentation on how the fund works is available in `FUND.md`.

## Installation

You'll want to run Truffle on Node.js v10.21.0 (latest Dubnium LTS because latest Erbium LTS doesn't work) with the latest version of NPM.

`npm i -g truffle`

`npm i` or `npm install`

## Compiling the contracts

`npm run compile`

## Testing deployment

In `.env`, configure `DEVELOPMENT_ADDRESS` and `DEVELOPMENT_PRIVATE_KEY` to test deployment.

First, fork the mainnet with `ganache-core`. You'll want to use [this `ganache-core` fork from Compound](https://github.com/compound-finance/ganache-core/tree/jflatow/unbreak-fork) to fix a bug (false reentrancy revert). Make sure the `development` network in `truffle-config.js` is configured correctly to use your `ganache-core` instance.

Then, migrate: `truffle migrate --network development`

## Testing the contracts

In `.env`, configure `DEVELOPMENT_ADDRESS` and `DEVELOPMENT_PRIVATE_KEY` to test deployment and `DEVELOPMENT_PRIVATE_KEY_SECONDARY` to run automated tests.

First, fork the mainnet with `ganache-core`. You'll want to use [this `ganache-core` fork from Compound](https://github.com/compound-finance/ganache-core/tree/jflatow/unbreak-fork) to fix a bug (false reentrancy revert). Make sure the `development` network in `truffle-config.js` is configured correctly to use your `ganache-core` instance.

Then, test: `npm t` or `npm test`

## Live deployment

In `.env`, configure `LIVE_DEPLOYER_ADDRESS`, `LIVE_DEPLOYER_PRIVATE_KEY`, `LIVE_INFURA_PROJECT_ID`, `LIVE_FUND_OWNER`, `LIVE_FUND_REBALANCER`, and `LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY` to deploy to the mainnet.

Then, set the gas price for the `live` network in truffle-config.js to the "fast" price listed by [ETH Gas Station](https://www.ethgasstation.info/).

Then, migrate: `truffle migrate --network live`

## Building the dApp

`npm run build`

## Testing the dApp

`npm run dev`

## Credits

Rari Capital's smart contracts are developed by [David Lucid](https://github.com/davidlucid) of David Lucid LLC.

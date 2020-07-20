# Rari Capital Contracts & dApp

Welcome to `rari-contracts`, the central repository for the Solidity source code behind Rari Capital's Ethereum-based smart contracts (with automated tests), our stablecoin fund's dApp (web client), and the documentation for it all.

## Using the contracts

API documentation for our smart contracts is available in `API.md`.

## How it works

Documentation on how the fund works is available in `FUND.md`.

## Installation

You'll want to run Truffle on Node.js v10.21.0 (latest Dubnium LTS because latest Erbium LTS doesn't work) with the latest version of NPM.

To compile `v1.2.0`, we used Soldity version `0.5.17+commit.d19bba13` (should be chosen automatically by Truffle). To deploy and test `v1.2.0`, we used Truffle `v5.1.34` (should use Web3.js `v1.2.1`).

`npm i -g truffle`

`npm i` or `npm install`

## Compiling the contracts

`npm run compile`

## Testing deployment

In `.env`, configure `DEVELOPMENT_ADDRESS` and `DEVELOPMENT_PRIVATE_KEY` to test deployment.

First, fork the mainnet with `ganache-core`. You'll want to use [this `ganache-core` fork from Compound](https://github.com/compound-finance/ganache-core/tree/jflatow/unbreak-fork) to fix a bug (false reentrancy revert). Make sure the `development` network in `truffle-config.js` is configured correctly to use your `ganache-core` instance.

Then, migrate: `truffle migrate --network development`

If you'd like to test gasless deposits via `RariFundProxy.deposit` via the Gas Station Network, making sure `npx` is installed, run `chmod +x test.sh bin/gsn-relay` and `sh test.sh`. Then, fund `RariFundProxy` using `npx @openzeppelin/gsn-helpers fund-recipient --recipient $RARI_FUND_PROXY_ADDRESS -n http://localhost:8546 -f $FROM_ADDRESS` or [this tool](https://www.opengsn.org/recipients) (or manually send ETH to `RelayHub(0xD216153c06E857cD7f72665E0aF1d7D82172F494).depositFor(address target)`). Finally, run `rari-gsn-signer` with `pm2 start ecosystem.config.js` after configuring `ecosystem.config.js`. Please note that as of now, the web client and the GSN signer are configured so that gas is paid only for deposits of least 250 DAI by first-time users.

## Testing the contracts

In `.env`, configure `DEVELOPMENT_ADDRESS` and `DEVELOPMENT_PRIVATE_KEY` to test deployment and `DEVELOPMENT_PRIVATE_KEY_SECONDARY` to run automated tests.

First, fork the mainnet with `ganache-core`. You'll want to use [this `ganache-core` fork from Compound](https://github.com/compound-finance/ganache-core/tree/jflatow/unbreak-fork) to fix a bug (false reentrancy revert). Make sure the `development` network in `truffle-config.js` is configured correctly to use your `ganache-core` instance.

Then, test: `npm t` or `npm test`

## Live deployment

In `.env`, configure `LIVE_DEPLOYER_ADDRESS`, `LIVE_DEPLOYER_PRIVATE_KEY`, `LIVE_INFURA_PROJECT_ID`, `LIVE_FUND_OWNER`, `LIVE_FUND_REBALANCER`, `LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY`, and `LIVE_FUND_GSN_TRUSTED_SIGNER` to deploy to the mainnet.

If you are upgrading from `v1.0.0`, set `UPGRADE_FROM_LAST_VERSION=1` to enable upgrading and configure `UPGRADE_OLD_FUND_PROXY`, `UPGRADE_FUND_MANAGER`, `UPGRADE_FUND_OWNER_ADDRESS`, and `UPGRADE_FUND_OWNER_PRIVATE_KEY` as well.

Then, set the gas price for the `live` network in truffle-config.js to the "fast" price listed by [ETH Gas Station](https://www.ethgasstation.info/).

Then, migrate: `truffle migrate --network live`

If you'd like to provide gasless deposits via `RariFundProxy.deposit` via the Gas Station Network, make sure to fund `RariFundProxy` using `npx @openzeppelin/gsn-helpers fund-recipient --recipient $RARI_FUND_PROXY_ADDRESS -n $ETHEREUM_NODE_URL -f $FROM_ADDRESS` or [this tool](https://www.opengsn.org/recipients) (or manually send ETH to `RelayHub(0xD216153c06E857cD7f72665E0aF1d7D82172F494).depositFor(address target)`). Then, run `rari-gsn-signer` with `pm2 start ecosystem.config.js --env production` after configuring `ecosystem.config.js`. Please note that as of now, the web client and the GSN signer are configured so that gas is paid only for deposits of least 250 DAI by first-time users.

## Building the dApp

`npm run build`

## Testing the dApp

`npm run dev`

## Credits

Rari Capital's smart contracts are developed by [David Lucid](https://github.com/davidlucid) of David Lucid LLC.

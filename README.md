# Rari Stable Pool: Smart Contracts & dApp

Welcome to `rari-contracts`, the central repository for the Solidity source code behind the Rari Stable Pool's Ethereum-based smart contracts (with automated tests), our stablecoin fund's dApp (web client), and the documentation for it all. You can find out more about Rari at [www.rari.capital](https://rari.capital).

## How the fund works

Documentation on how the stablecoin fund works is available in `FUND.md`.

## Contract usage

Documentation on common usage of the contracts is available in `USAGE.md`. Detailed API documentation for our smart contracts' public methods is available in `API.md`. Smart contract ABIs are available in the `abi` properties of the JSON files in the `build` folder.

## dApp usage

Anyone can use our dApp for our live stablecoin fund right now at [app.rari.capital](https://app.rari.capital). However, to be extra safe, you should download or clone this repository and use the web client (located in the `src` folder) locally simply by opening `src/index.html` in your web browser, but be mindful of updates!

## Installation (for development and deployment)

We, as well as others, had success using Truffle on Node.js `v12.18.2` with the latest version of NPM.

To install the latest version of Truffle: `npm install -g truffle`

*Though the latest version of Truffle should work, to compile, deploy, and test our contracts, we used Truffle `v5.1.45` (which should use `solc` version `0.5.17+commit.d19bba13.Emscripten.clang` and Web3.js `v1.2.1`).*

To install all our dependencies: `npm install`

## Compiling the contracts

`npm run compile`

## Testing the contracts

In `.env`, set `DEVELOPMENT_ADDRESS=0x45D54B22582c79c8Fb8f4c4F2663ef54944f397a` to test deployment and also set `DEVELOPMENT_ADDRESS_SECONDARY=0x1Eeb75CFad36EDb6C996f7809f30952B0CA0B5B9` to run automated tests.

If you are upgrading from `v1.2.0`, set `UPGRADE_FROM_LAST_VERSION=1` to enable upgrading and configure the following:

    UPGRADE_OLD_FUND_CONTROLLER=0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb
    UPGRADE_OLD_FUND_MANAGER=0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464
    UPGRADE_OLD_FUND_PROXY=0xb6b79D857858004BF475e4A57D4A446DA4884866
    UPGRADE_OLD_FUND_TOKEN=0x9366B7C00894c3555c7590b0384e5F6a9D55659f
    UPGRADE_FUND_OWNER_ADDRESS=0xb568a7a185305e1cc027e13a27db7c5bf99e81d8

Also, set `GANACHE_UPGRADE_FUND_TOKEN_HOLDERS` to a comma-separated list of all current RSPT holders (because `getPastEvents` does not work with Ganache).

First, fork the Ethereum mainnet (tested on Node.js `v10.21.0`). To start the fork, configure `DEVELOPMENT_WEB3_PROVIDER_URL_TO_BE_FORKED` (set to any mainnet Web3 HTTP provider JSON-RPC URL; we use a local `geth` instance, specifically a light client started with `geth --syncmode light --rpc --rpcapi eth,web3,debug,net`; Infura works too, but beware of latency and rate limiting) in `.env` and run `npm run ganache`. *If you would like to change the port, make sure to configure `scripts/ganache.js`, `scripts/test.sh`, and the `development` network in `truffle-config.js`.* Note that you will likely have to regularly restart your fork, especially when forking from a node without archive data or when using live 0x API responses to make currency exchanges.

To deploy the contracts to your private mainnet fork: `truffle migrate --network development --skip-dry-run --reset`

To run automated tests on the contracts on your private mainnet fork, run `npm test` (which runs `npm run ganache` in the background for you).

If you'd like to test gasless deposits via `RariFundProxy.deposit` via the Gas Station Network:

* Download `https://github.com/OpenZeppelin/openzeppelin-gsn-provider/blob/master/bin/gsn-relay` to `bin/gsn-relay` and set permissions with `chmod +x bin/gsn-relay`.
* Making sure `npx` is installed, run `npm dev-gsn`.
* Fund `RariFundProxy` using `npx @openzeppelin/gsn-helpers fund-recipient --recipient $RARI_FUND_PROXY_ADDRESS -n http://localhost:8546 -f $FROM_ADDRESS` or [this tool](https://www.opengsn.org/recipients) (or manually send ETH to `RelayHub(0xD216153c06E857cD7f72665E0aF1d7D82172F494).depositFor(address target)`).
* Run `rari-gsn-signer` with `pm2 start ecosystem.config.js` after configuring `ecosystem.config.js`.
* *Please note that as of now, the web client and the GSN signer are configured so that gas is paid only for deposits of least 250 DAI/USDC/USDT by first-time users.*

## Live deployment

In `.env`, configure `LIVE_DEPLOYER_ADDRESS`, `LIVE_DEPLOYER_PRIVATE_KEY`, `LIVE_WEB3_PROVIDER_URL`, `LIVE_GAS_PRICE` (ideally, use the "fast" price listed by [ETH Gas Station](https://www.ethgasstation.info/)), `LIVE_FUND_OWNER`, `LIVE_FUND_REBALANCER`, `LIVE_FUND_INTEREST_FEE_MASTER_BENEFICIARY`, and `LIVE_FUND_GSN_TRUSTED_SIGNER` to deploy to the mainnet.

If you are upgrading from `v1.2.0`, set `UPGRADE_FROM_LAST_VERSION=1` to enable upgrading and configure the following:

    UPGRADE_OLD_FUND_CONTROLLER=0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb
    UPGRADE_OLD_FUND_MANAGER=0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464
    UPGRADE_OLD_FUND_PROXY=0xb6b79D857858004BF475e4A57D4A446DA4884866
    UPGRADE_OLD_FUND_TOKEN=0x9366B7C00894c3555c7590b0384e5F6a9D55659f
    UPGRADE_FUND_OWNER_ADDRESS=0xb568a7a185305e1cc027e13a27db7c5bf99e81d8

You must also set `UPGRADE_FUND_OWNER_PRIVATE_KEY` and `UPGRADE_TIMESTAMP_COMP_CLAIMED_AND_EXCHANGED` (set to current timestamp after claiming and exchanging COMP via rebalancer; you must run migrations within 1 hour of this timestamp).

Furthermore, if you plan to migrate without the `--skip-dry-run` flag, set `GANACHE_UPGRADE_FUND_TOKEN_HOLDERS` to a comma-separated list of all current RSPT holders (because `getPastEvents` does not work with the Ganache fork used by the dry run).

Then, migrate: `truffle migrate --network live`

If you'd like to provide gasless deposits via `RariFundProxy.deposit` via the Gas Station Network:

* Fund `RariFundProxy` using `npx @openzeppelin/gsn-helpers fund-recipient --recipient $RARI_FUND_PROXY_ADDRESS -n $ETHEREUM_NODE_URL -f $FROM_ADDRESS` or [this tool](https://www.opengsn.org/recipients) (or manually send ETH to `RelayHub(0xD216153c06E857cD7f72665E0aF1d7D82172F494).depositFor(address target)`).
* Run `rari-gsn-signer` with `pm2 start ecosystem.config.js --env production` after configuring `ecosystem.config.js`.
* *Please note that as of now, the web client and the GSN signer are configured so that gas is paid only for deposits of least 250 DAI/USDC/USDT by first-time users.*

## Building the dApp

`npm run build-dapp`

## Testing the dApp

`npm run dev-dapp`

## License

See `LICENSE`.

## Credits

Rari Capital's smart contracts are developed by [David Lucid](https://github.com/davidlucid).

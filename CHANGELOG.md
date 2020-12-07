# Changelog

## `v2.4.1` (no contracts deployed; all code pushed 2020-12-07)

* Updated mStable swap tests to skip removed bAssets (i.e., DAI).

## `v2.4.0` (contracts deployed 2020-11-25; all code pushed 2020-11-29)

* Fixed bug in validation of mUSD redemption in `RariFundController.withdrawAndExchange`.

## `v2.3.0` (contracts deployed 2020-10-29; all code pushed 2020-11-13)

* Added `RariFundPriceConsumer.allCurrenciesPeggedTo1Usd` variable.

## `v2.2.0` (contracts deployed 2020-10-27; all code pushed 2020-10-29)

* Added 0.5% withdrawal fee.
    * Removed `RariFundManager.withdrawFees` to save gas on deployment.

## `v2.1.0` (contracts deployed 2020-10-20; all code pushed 2020-10-28)

* Implemented liquidity mining of RGT (Rari Governance Token) distributions.
* Removed account balance limit functions.
* Moved dApp to `rari-dapp-legacy`.
* Gave `RariFundManager` permission to burn RSPT on withdrawals without the need for approval transactions.
* Various minor improvements to `RariFundManager` (e.g., replaced `disableFund` and `enableFund` with `setFundDisabled`).
* Fixed `LIVE_UPGRADE_FUND_OWNER_PRIVATE_KEY` in `truffle-config.js`.
* Changed performance/interest fee rate to 9.5%.

## `v2.0.0` (contracts deployed 2020-09-21; all code pushed 2020-10-05)

* Rebranded to Rari Stable Pool and Rari Stable Pool Token (RSPT).
* Implemented lending via Aave.
* Implemented lending and exchanges via mStable.
* Removed account balance limit.
* Implemented daily limit on proportion of funds lost due to exchange.
* Added currency and pool allocation pie chart to web client.
* Fixed slippage calculation logic in web client.
* Fixed Quantstamp audit findings:
    * Implement stablecoin pricing via Chainlink (QSP-1).
    * Replaced calls to `transfer()` with `call.value()` (QSP-3).
    * Implemented proxy storage for `RariFundManager`, `RariFundToken`, and `RariFundPriceConsumer` (QSP-3).
    * Upgrade RFT, removing `interestAccruedBy` to save gas and remove `initNetDeposits` (QSP-3).
    * Replace imitation of `balanceOfUnderlying` with actual call to `balanceOfUnderlying` in `CompoundPoolController` (QSP-4).
    * Make sure new contract address is a `RariFundController` in `upgradeFundController` (QSP-5).
    * Updated docs (QSP-7, QSP-10).
    * Make sure sender is the 0x Exchange v3 contract in fallback functions of `RariFundController` and `RariFundProxy` (QSP-8).
    * Check for overflow before conversion from uint256 to int256 (QSP-9).
    * Locked all Solidity version pragmas to 0.5.17 (QSP-11, QSP-12).
    * Improved code comments (QSP-10, QSP-14).
* Fixed bug in which `RariFundManager._withdrawFrom` could have overestimated the amount of RFT burned (see commit [9059e8c](https://github.com/Rari-Capital/rari-stable-pool-contracts/commit/9059e8c4c8c9de545680b70f20981f261bfc425d)).
    * It seems that this bug did not cause any issues before it was fixed: it was discovered during development and was never reported by any users.
* Other changes to contracts:
    * Externalized pool and exchange libraries.
    * Added events for pool allocations.
    * Optimized `RariFundController`.
    * Add `RariFundManager.getAcceptedCurrencies` and replace `RariFundController.getPoolBalances` with `RariFundProxy.getRawFundBalancesAndPrices` to speed up web client.
    * Replaced `setAcceptedCurrency` with `setAcceptedCurrencies` to minimize rebalancer gas usage.
    * Added `getAccountBalanceLimit` function to `RariFundManager`.
    * Moved token forwarding logic from `RariFundManager.setFundController` to `RariFundController.upgradeFundController`.
    * Store decimal precision of tokens in contracts instead of querying the token contracts (to save gas).
    * Added `forwardLostFunds` function to RariFundManager and RariFundProxy to forward lost tokens accidentally transferred directly to these contracts.
    * Made Rari contract variables public in contracts.
    * Removed unnecessary boolean return values.
    * Removed version constants from all contracts.
    * Add fund owner as minter of RSPT in case of emergency.
    * Other small improvements, bug fixes, comments, documentation, etc.
* Other changes to testing:
    * Added Travis CI.
        * Run Ganache beforehand in test script so Travis CI works.
    * Unlock development accounts in Ganache so we don't need private keys for testing.
    * Reordered tests so 0x exchanges come first so orders from 0x API are fresh.
    * Assert with margin of error in `test/3_fund_owner.js`.
    * Fixed accepted margin of error in `test/5_fund_user.js`.
    * Added test to check gas used by `RariFundController.upgradeFundController`.
    * Added test to check gas used by `RariFundProxy.withdrawAndExchange`.
    * Moved scripts to `scripts` folder and set as executable.
    * Increased block gas limit to 12.5 million in `scripts/ganache.js`.
    * Minor improvements to test dummy contracts.
    * Other improvements to test scripts.
    * Added copyright notices to tests.
* Other changes to web client:
    * Updated web3.js and providers used by web client.
    * Other minor web client improvements and bug fixes.
* Other changes to documentation:
    * Added `USAGE.md`.
    * Improved `README.md`, `API.md`, and `DEPLOYED.md`.
    * Renamed `FUND.md` to `CONCEPT.md` and improved content.
    * Added UML class diagrams for contracts.
    * Added Solidity metrics report.
* Other changes to package:
    * Replaced patched fork of `ganche-core` with genuine beta update.
    * Upgrade Truffle to `v5.1.45`.
    * Added build folder to `.gitignore`.
    * Added GitHub repo and links to `package.json`.

## `v1.2.0` (contracts deployed 2020-07-20; all code pushed 2020-08-03)
* Implemented GSN support for DAI deposits via `RariFundProxy.deposit`.
* Resdesigned and improved web client.
    * Modal popups for slippage and exchange fee confirmation.
    * Replaced today's APY with current APY.
    * Fixed Fortmatic support.
    * Cache 0x prices for 60 seconds so slippage doesn't change so quickly.
    * Implemented account balance limit checking for deposits.
    * Support for transferring RFT in USD quantities.
    * Improved input handling for deposits, withdrawals and transfers.
    * Better number formatting.
    * Analytics support with Mixpanel.
    * Show USD equivalents of ETH exchange fees.
    * Various bug fixes.
    * Updated WalletConnect and Web3Modal.
* Simplified `.gitignore`.
* Updated README.md and API.md, added license, and improved source code comments.

## `v1.1.0` (contracts deployed 2020-07-14; all code pushed 2020-07-17)
* Contracts were restructured to make RariFundManager smaller so we can add more code to it (like gas optimizations).
* Various bugs have also been fixed (e.g., USDT approval error in RariFundProxy.exchangeAndDeposit).
* Also added migrations code for upgrading from v1.0.0.
* Added COMP to current APY, APY today, and charts in web client.
* Fixed Fortmatic and Portis API keys in web client.
* Use stablecoin prices for slippage indicators in web client.
* Fixed minor bug in taker fee processing in 0x exchange code in web client and smart contract tests.
* Withdraw tokens from Rari before each test in `test/account-balance-limit.js`.
* Fix bug in assertion in `test/fund-fees.js`.
* Widened APY today display on web client.
* Minor fixes to app.js related to error handling.
* Reworded package description, docs, and web client content, error messages, and code comments.

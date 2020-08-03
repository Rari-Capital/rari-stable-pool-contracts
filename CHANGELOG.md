# Changelog

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

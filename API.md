# Rari Stable Pool: Smart Contract API

Welcome to the API docs for `RariFundManager`, `RariFundToken`, and `RariFundProxy`, the smart contracts behind the Rari Stable Pool.

* See [`USAGE.md`](USAGE.md) for instructions on common usage of the smart contracts' APIs.
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RSPT.
* Smart contract ABIs are available in the `abi` properties of the JSON files in the `build` folder.

*If you're using JavaScript, don't waste your time directly integrating our smart contracts: the [Rari JavaScript SDK](https://github.com/Rari-Capital/rari-sdk) makes programmatic deposits and withdrawals as easy as just one line of code!*

## **User Balance and Interest**

### `uint256 RariFundManager.balanceOf(address account)`

Returns the total balance in USD (scaled by 1e18) supplied to the Rari Stable Pool by `account`.

* Parameters:
    * `account` (address) - The account whose balance we are calculating.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## **Deposits**

### `bool RariFundManager.isCurrencyAccepted(string currencyCode)`

Returns a boolean indicating if deposits in `currencyCode` are currently accepted.

* Parameters:
    * `currencyCode` (string): The currency code to check.

### `string[] RariFundManager.getAcceptedCurrencies()`

Returns an array of currency codes currently accepted for deposits.

* Development notes:
    * *Ideally, we can add the `view` modifier to this function, but it potentially modifies the state (see comments on `_acceptedCurrenciesArray`).*

### `RariFundProxy.deposit(string currencyCode, uint256 amount)`

***For a limited time only, we are paying gas fees for first-time deposits of at least 250 DAI/USDC/USDT!***

Deposits funds to the Rari Stable Pool in exchange for RSPT (with GSN support).

* You may only deposit currencies accepted by the fund (see `RariFundManager.isCurrencyAccepted(string currencyCode)`).
* Please note that you must approve RariFundProxy to transfer at least `amount`.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be deposited.
    * `amount` (uint256): The amount of tokens to be deposited.

### `RariFundManager.deposit(string currencyCode, uint256 amount)`

Deposits funds to the Rari Stable Pool in exchange for RSPT.

* You may only deposit currencies accepted by the fund (see `RariFundManager.isCurrencyAccepted(string currencyCode)`). However, `RariFundProxy.exchangeAndDeposit` exchanges your funds via 0x and deposits them in one transaction.
* Please note that you must approve RariFundManager to transfer at least `amount`.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be deposited.
    * `amount` (uint256): The amount of tokens to be deposited.

### `RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)`

Exchanges and deposits funds to the Rari Stable Pool in exchange for RSPT (via 0x).

* You can retrieve order data from the [0x swap API](https://0x.org/docs/api#get-swapv0quote). See [`USAGE.md`](USAGE.md), the SDK, or the web client for implementation.
* Please note that you must approve RariFundProxy to transfer at least `inputAmount` unless you are inputting ETH.
* You also must input at least enough ETH to cover the protocol fee (and enough to cover `orders` if you are inputting ETH).
* Parameters:
    * `inputErc20Contract` (address): The ERC20 contract address of the token to be exchanged. Set to address(0) to input ETH.
    * `inputAmount` (uint256): The amount of tokens to be exchanged (including taker fees).
    * `outputCurrencyCode` (string): The currency code of the token to be deposited after exchange.
    * `orders` (LibOrder.Order[]): The limit orders to be filled in ascending order of the price you pay.
    * `signatures` (bytes[]): The signatures for the orders.
    * `takerAssetFillAmount` (uint256): The amount of the taker asset to sell (excluding taker fees).
* Development notes:
    * *We should be able to make this function external and use calldata for all parameters, but [Solidity does not support calldata structs](https://github.com/ethereum/solidity/issues/5479).*

### `RariFundProxy.exchangeAndDeposit(string inputCurrencyCode, uint256 inputAmount, string outputCurrencyCode)`

Exchanges and deposits funds to the Rari Stable Pool in exchange for RSPT (no slippage and low fees via mStable, but only supports DAI, USDC, USDT, TUSD, and mUSD).

* Please note that you must approve RariFundProxy to transfer at least `inputAmount`.
* Parameters:
    * `inputCurrencyCode` (string): The currency code of the token to be exchanged.
    * `inputAmount` (uint256): The amount of tokens to be exchanged (including taker fees).
    * `outputCurrencyCode` (string): The currency code of the token to be deposited after exchange.

## **Withdrawals**

### `RariFundManager.withdraw(string currencyCode, uint256 amount)`

Withdraws funds from the Rari Stable Pool in exchange for RSPT.

* You may only withdraw currencies held by the fund (see `RariFundManager.getRawFundBalance(string currencyCode)`). However, `RariFundProxy.withdrawAndExchange` withdraws your funds and exchanges them via 0x in one transaction.
* Please note that you must approve RariFundManager to burn of the necessary amount of RSPT.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be withdrawn.
    * `amount` (uint256): The amount of tokens to be withdrawn.

### `RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)`

Withdraws funds from the Rari Stable Pool in exchange for RSPT and exchanges to them to the desired currency (if no 0x orders are supplied, exchanges DAI, USDC, USDT, TUSD, and mUSD via mStable).

* You can retrieve order data from the [0x swap API](https://0x.org/docs/api#get-swapv0quote). See [`USAGE.md`](USAGE.md), the SDK, or the web client for implementation.
* Please note that you must approve RariFundManager to burn of the necessary amount of RSPT. You also must input at least enough ETH to cover the protocol fees.
* Parameters:
    * `inputCurrencyCodes` (string[]): The currency codes of the tokens to be withdrawn and exchanged.
        * To directly withdraw the output currency without exchange in the same transaction, simply include the output currency code in `inputCurrencyCodes`.
    * `inputAmounts` (uint256[]): The amounts of tokens to be withdrawn and exchanged (including taker fees).
        * To directly withdraw as much of the output currency without exchange in the same transaction, set the corresponding `inputAmounts` item to the directly withdrawable raw fund balance of that currency.
    * `outputErc20Contract` (address): The ERC20 contract address of the token to be outputted by the exchange. Set to address(0) to output ETH.
    * `orders` (LibOrder.Order[][]): The 0x limit orders to be filled in ascending order of the price you pay.
        * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `orders` item to an empty array.
    * `signatures` (bytes[][]): The signatures for the 0x orders.
        * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `signatures` item to an empty array.
    * `makerAssetFillAmounts` (uint256[]): The amounts of the maker assets to buy.
        * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `makerAssetFillAmounts` item to 0.
    * `protocolFees` (uint256[]): The protocol fees to pay to 0x in ETH for each order.
        * To exchange one of `inputCurrencyCodes` via mStable instead of 0x or to directly withdraw the output currency in the same transaction, set the corresponding `protocolFees` item to 0.
* Development notes:
    * *We should be able to make this function external and use calldata for all parameters, but [Solidity does not support calldata structs](https://github.com/ethereum/solidity/issues/5479).*

## **RSPT (Rari Stable Pool Token)**

See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RSPT. Here are a few of the most common ones:

### `uint256 RariFundToken.balanceOf(address account)`

Returns the amount of RSPT owned by `account`.

* A user's RSPT balance is an internal representation of their USD balance.
    * While a user's USD balance is constantly increasing as the Rari Stable Pool accrues interest, a user's RSPT balance does not change except on deposit, withdrawal, and transfer.
    * The price of RSPT is equivalent to the current value of the first $1 USD deposited to the Rari Stable Pool.
* Parameters:
    * `account` (address) - The account whose balance we are retrieving.

### `bool RariFundToken.transfer(address recipient, uint256 amount)`

Transfers the specified `amount` of RSPT to `recipient`.

* Parameters:
    * `recipient` (address): The recipient of the RSPT.
    * `inputAmounts` (uint256[]): The amounts of tokens to be withdrawn and exchanged (including taker fees).
* Return value: Boolean indicating success.

### `bool RariFundToken.approve(address spender, uint256 amount)`

Approve `sender` to spend the specified `amount` of RSPT on behalf of `msg.sender`.

* As with the `approve` functions of other ERC20 contracts, beware that changing an allowance with this method brings the risk that someone may use both the old and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
* Parameters:
    * `spender` (address) - The account to which we are setting an allowance.
    * `amount` (uint256) - The amount of the allowance to be set.
* Return value: Boolean indicating success.

### `uint256 RariFundToken.totalSupply()`

Returns the total supply of RSPT (scaled by 1e18).

* Divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RSPT in USD (scaled by 1e18).

## **Total Supply and Interest**

### `uint256 RariFundManager.getFundBalance()`

Returns the total balance supplied by users to the Rari Stable Pool (all RSPT holders' funds but not unclaimed fees) in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `int256 RariFundManager.getInterestAccrued()`

Returns the total amount of interest accrued (excluding the fees paid on interest) by past and current Rari Stable Pool users (i.e., RSPT holders) in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## **Fees**

### `uint256 RariFundManager.getInterestFeeRate()`

Returns the fee rate on interest (proportion of raw interest accrued scaled by 1e18).

### `int256 RariFundManager.getInterestFeesGenerated()`

Returns the amount of interest fees accrued by beneficiaries in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `uint256 RariFundManager.getWithdrawalFeeRate()`

Returns the withdrawal fee rate (proportion of every withdrawal taken as a service fee scaled by 1e18).

## **Raw Total Supply, Allocations, and Interest**

### `uint256 RariFundManager.getRawFundBalance()`

Returns the raw total balance of the Rari Stable Pool (all RSPT holders' funds + all unclaimed fees) of all currencies in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `uint256 RariFundManager.getRawFundBalance(string currencyCode)`

Returns the raw total balance of the Rari Stable Pool (all RSPT holders' funds + all unclaimed fees) of the specified currency.

* Parameters:
    * `currencyCode` (string): The currency code of the balance to be calculated.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `RariFundController.getPoolBalance`) potentially modifies the state.*

### `(string[], uint256[], RariFundController.LiquidityPool[][], uint256[][], uint256[]) RariFundProxy.getRawFundBalancesAndPrices()`

Returns the fund controller's contract balance of each currency, balance of each pool of each currency (checking `_poolsWithFunds` first to save gas), and price of each currency.

* Return values: An array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, an array of arrays of corresponding balances at each pool index for each currency code, and an array of prices in USD (scaled by 1e18) for each currency code.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getPoolBalance`) potentially modifies the state.*

### `int256 RariFundManager.getRawInterestAccrued()`

Returns the raw total amount of interest accrued by the Rari Stable Pool (including the fees paid on interest) in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## **Internal Stablecoin Pricing**

### `uint256[] RariFundPriceConsumer.getCurrencyPricesInUsd()`

Returns the prices of all supported stablecoins to which funds can be allocated.

* Use these prices to calculate the value added to a user's USD balance due to a direct deposit and the value subtracted from a user's USD balance due to a direct withdrawal.
* Return value: An array of prices in USD (scaled by 1e18) corresponding to the following list of currencies in the following order: DAI, USDC, USDT, TUSD, BUSD, sUSD, and mUSD.

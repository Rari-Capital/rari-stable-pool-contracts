# Rari Capital Smart Contract API Documentation

Welcome to the API docs for `RariFundManager`, `RariFundToken`, and `RariFundProxy`, the smart contracts behind Rari Capital's stablecoin fund.

* See `USAGE.md` for instructions on common usage of the smart contracts' APIs.
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RFT.
* Smart contract ABIs are available in the `abi` properties of the JSON files in the `build` folder.

## **User Balances and Interest**

### `uint256 RariFundManager.balanceOf(address account)`

Returns the total balance in USD (scaled by 1e18) of `account`.

* Parameters:
    * `account` (address) - The account whose balance we are calculating.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `uint256 RariFundToken.balanceOf(address account)`

Returns the amount of RFT owned by `account`.

* A user's RFT balance is an internal representation of their USD balance.
    * While a user's USD balance is constantly increasing as the fund accrues interest, a user's RFT balance does not change except on deposit, withdrawal, and transfer.
    * The price of RFT is equivalent to the current value of 1 USD deposited at the fund's inception.
* Parameters:
    * `account` (address) - The account whose balance we are retrieving.

### `int256 RariFundManager.interestAccruedBy(address account)`

Returns the total amount of interest accrued by `account` (excluding the fees paid on interest) in USD (scaled by 1e18).

* Parameters:
    * `account` (address) - The account whose interest we are calculating.
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

### `bool RariFundProxy.deposit(string currencyCode, uint256 amount)`

***For a limited time only, we are paying gas fees for first-time deposits of at least 250 DAI/USDC/USDT!***

Deposits funds to RariFund in exchange for RFT (with GSN support).

* You may only deposit currencies accepted by the fund (see `RariFundManager.isCurrencyAccepted(string currencyCode)`).
* Please note that you must approve RariFundProxy to transfer at least `amount`.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be deposited.
    * `amount` (uint256): The amount of tokens to be deposited.
* Return value: Boolean indicating success.

### `bool RariFundManager.deposit(string currencyCode, uint256 amount)`

Deposits funds to RariFund in exchange for RFT.

* You may only deposit currencies accepted by the fund (see `RariFundManager.isCurrencyAccepted(string currencyCode)`). However, `RariFundProxy.exchangeAndDeposit` exchanges your funds via 0x and deposits them in one transaction.
* Please note that you must approve RariFundManager to transfer at least `amount`.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be deposited.
    * `amount` (uint256): The amount of tokens to be deposited.
* Return value: Boolean indicating success.

### `bool RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)`

Exchanges and deposits funds to RariFund in exchange for RFT.

* You can retrieve order data from the [0x swap API](https://0x.org/docs/api#get-swapv0quote). See the web client for implementation.
* Please note that you must approve RariFundProxy to transfer at least `inputAmount` unless you are inputting ETH.
* You also must input at least enough ETH to cover the protocol fee (and enough to cover `orders` if you are inputting ETH).
* Parameters:
    * `inputErc20Contract` (address): The ERC20 contract address of the token to be exchanged. Set to address(0) to input ETH.
    * `inputAmount` (uint256): The amount of tokens to be exchanged (including taker fees).
    * `outputCurrencyCode` (string): The currency code of the token to be deposited after exchange.
    * `orders` (LibOrder.Order[]): The limit orders to be filled in ascending order of the price you pay.
    * `signatures` (bytes[]): The signatures for the orders.
    * `takerAssetFillAmount` (uint256): The amount of the taker asset to sell (excluding taker fees).
* Return value: Boolean indicating success.
* Development notes:
    * *We should be able to make this function external and use calldata for all parameters, but [Solidity does not support calldata structs](https://github.com/ethereum/solidity/issues/5479).*

## **Withdrawals**

### `bool RariFundManager.withdraw(string currencyCode, uint256 amount)`

Withdraws funds from RariFund in exchange for RFT.

* You may only withdraw currencies held by the fund (see `RariFundManager.getRawFundBalance(string currencyCode)`). However, `RariFundProxy.withdrawAndExchange` withdraws your funds and exchanges them via 0x in one transaction.
* Please note that you must approve RariFundManager to burn of the necessary amount of RFT.
* Parameters:
    * `currencyCode` (string): The currency code of the token to be withdrawn.
    * `amount` (uint256): The amount of tokens to be withdrawn.
* Return value: Boolean indicating success.

### `bool RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)`

Exchanges and deposits funds to RariFund in exchange for RFT.

* You can retrieve order data from the [0x swap API](https://0x.org/docs/api#get-swapv0quote). See the web client for implementation.
* Please note that you must approve RariFundManager to burn of the necessary amount of RFT. You also must input at least enough ETH to cover the protocol fees.
* Parameters:
    * `inputCurrencyCodes` (string[]): The currency codes of the tokens to be withdrawn and exchanged.
    * `inputAmounts` (uint256[]): The amounts of tokens to be withdrawn and exchanged (including taker fees).
    * `outputErc20Contract` (address): The ERC20 contract address of the token to be outputted by the exchange. Set to address(0) to output ETH.
    * `orders` (LibOrder.Order[][]): The limit orders to be filled in ascending order of the price you pay.
    * `signatures` (bytes[][]): The signatures for the orders.
    * `makerAssetFillAmounts` (uint256[]): The amounts of the maker assets to buy.
    * `protocolFees` (uint256[]): The protocol fees to pay to 0x in ETH for each order.
* Return value: Boolean indicating success.
* Development notes:
    * *We should be able to make this function external and use calldata for all parameters, but [Solidity does not support calldata structs](https://github.com/ethereum/solidity/issues/5479).*

## Rari Fund Token

See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RFT.

### `bool RariFundToken.transfer(address recipient, uint256 amount)`

Transfers `amount` RFT to `recipient` (as with other ERC20 tokens like RFT).

* Parameters:
    * `recipient` (address): The recipient of the .
    * `inputAmounts` (uint256[]): The amounts of tokens to be withdrawn and exchanged (including taker fees).
* Return value: Boolean indicating success.

### `bool RariFundToken.approve(address spender, uint256 amount)`

Sets `amount` as the allowance of `spender` over the caller's tokens.

* Parameters:
    * `spender` (address) - The account to which we are setting an allowance.
    * `amount` (uint256) - The amount of the allowance to be set.
* Return value: Boolean indicating success.

### `uint256 RariFundToken.totalSupply()`

Returns the total supply of RFT (scaled by 1e18).

* Divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RFT in USD (scaled by 1e18).

## **Fund Balances and Interest**

### `uint256 RariFundManager.getFundBalance()`

Returns the fund's total investor balance (all RFT holders' funds but not unclaimed fees) of all currencies in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `int256 RariFundManager.getInterestAccrued()`

Returns the total amount of interest accrued by past and current RFT holders (excluding the fees paid on interest) in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## **Fees on Interest**

### `uint256 RariFundManager.getInterestFeeRate()`

Returns the fee rate on interest (proportion of raw interest accrued scaled by 1e18).

### `int256 RariFundManager.getInterestFeesGenerated()`

Returns the amount of interest fees accrued by beneficiaries in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## **Raw Fund Balances and Interest**

### `int256 RariFundManager.getRawInterestAccrued()`

Returns the raw total amount of interest accrued by the fund as a whole (including the fees paid on interest) in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `uint256 RariFundManager.getRawFundBalance()`

Returns the fund's raw total balance (all RFT holders' funds + all unclaimed fees) of all currencies in USD (scaled by 1e18).

* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

### `uint256 RariFundManager.getRawFundBalance(string currencyCode)`

Returns the fund's raw total balance (all RFT holders' funds + all unclaimed fees) of the specified currency.

* Parameters:
    * `currencyCode` (string): The currency code of the balance to be calculated.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `RariFundController.getPoolBalance`) potentially modifies the state.*

### `(string[] memory, uint256[] memory, uint256[][] memory, uint256[][] memory) RariFundController.getAllBalances()`

Returns the fund controller's contract balance of each currency and balance of each pool of each currency (checking `_poolsWithFunds` first to save gas).

* Return values: An array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, and an array of arrays of corresponding balances at each pool index for each currency code.
* Development notes:
    * *Ideally, we can add the `view` modifier, but Compound's `getUnderlyingBalance` function (called by `getPoolBalance`) potentially modifies the state.*

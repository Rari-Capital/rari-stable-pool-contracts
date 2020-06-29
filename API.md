# Rari Capital Ethereum API Documentation

Welcome to the API docs for `RariFundManager` and `RariFundToken`, the smart contracts behind Rari Capital's quantitative fund. You can find out more about Rari at [www.rari.capital](https://rari.capital).

## uint256 RariFundToken.balanceOf(address account)

Returns the amount of RFT owned by `account`.

Parameters:

* `account` (address) - The account whose balance we are retrieving.

## uint256 RariFundManager.balanceOf(address account)

Returns an account's total balance in USD (scaled by 1e18).

Parameters:

* `account` (address) - The account whose balance we are calculating.

## int256 RariFundManager.interestAccruedBy(address account)

Returns the total amount of interest accrued by `account` (excluding the fees paid on interest) in USD (scaled by 1e18).

Parameters:

* `account` (address) - The account whose interest we are calculating.

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## bool RariFundManager.isCurrencyAccepted(string currencyCode)

Returns a boolean indicating if deposits in `currencyCode` are currently accepted.

Parameters:

* `currencyCode` (string): The currency code to check.

## bool RariFundManager.deposit(string currencyCode, uint256 amount)

Deposits funds to RariFund in exchange for RFT.

You may only deposit currencies accepted by the fund (see `RariFundManager.isCurrencyAccepted(string currencyCode)`). However, exchanges are integrated into the web client via 0x Instant.

Please note that you must approve RariFundManager to transfer at least `amount`.

Parameters:

* `currencyCode` (string): The currency code of the token to be deposited.
* `amount` (uint256): The amount of tokens to be deposited.

Return value: Boolean indicating success.

## bool RariFundManager.withdraw(string currencyCode, uint256 amount)

Withdraws funds from RariFund in exchange for RFT.

You may only withdraw currencies held by the fund (see `RariFundManager.getRawFundBalance(string currencyCode)`). However, exchanges are integrated into the web client via 0x Instant.

Please note that you must approve RariFundManager to burn of the necessary amount of RFT.

Parameters:

* `currencyCode` (string): The currency code of the token to be withdrawn.
* `amount` (uint256): The amount of tokens to be withdrawn.

Return value: Boolean indicating success.

## uint256 RariFundManager.getFundBalance()

Returns the fund's total investor balance (all RFT holders' funds but not unclaimed fees) of all currencies in USD (scaled by 1e18).

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## int256 RariFundManager.getInterestAccrued()

Returns the total amount of interest accrued by past and current RFT holders (excluding the fees paid on interest) in USD (scaled by 1e18).

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## uint256 RariFundManager.getInterestFeeRate()

Returns the fee rate on interest.

## int256 RariFundManager.getInterestFeesGenerated()

Returns the amount of interest fees accrued by beneficiaries in USD (scaled by 1e18).

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## int256 RariFundManager.getRawInterestAccrued()

Returns the raw total amount of interest accrued by the fund as a whole (including the fees paid on interest) in USD (scaled by 1e18).

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## uint256 RariFundManager.getRawFundBalance()

Returns the fund's raw total balance (all RFT holders' funds + all unclaimed fees) of all currencies in USD (scaled by 1e18).

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getRawFundBalance`) potentially modifies the state.*

## uint256 RariFundManager.getRawFundBalance(string currencyCode)

Returns the fund's raw total balance (all RFT holders' funds + all unclaimed fees) of the specified currency.

Parameters:

* `currencyCode` (string): The currency code of the balance to be calculated.

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `RariFundController.getPoolBalance`) potentially modifies the state.*


## uint256 RariFundManager.getRawPoolBalances(string currencyCode)

Returns the fund's raw balance (all RFT holders' funds + all unclaimed fees) in each pool of the specified currency.

Parameters:

* `currencyCode` (string): The currency code of the balance to be calculated.

Development notes:

* *Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `RariFundController.getPoolBalance`) potentially modifies the state.*

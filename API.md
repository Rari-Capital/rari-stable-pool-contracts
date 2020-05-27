# RariFund Ethereum API Documentation

Welcome to the API docs for **RariFundManager** and **RariFundToken**, the smart contracts behind Rari Capital's quantitative fund. You can find out more about Rari at [http://rari.capital](http://rari.capital).

## uint256 RariFundToken.balanceOf(address account)

Returns the amount of RFT owned by `account`.

Parameters:

 - **account** (address) - The account whose balance we are calculating.

## uint256 RariFundManager.usdBalanceOf(address account)

Returns an account's total balance in USD (scaled by 1e18).

Parameters:

 - **account** (address) - The account whose balance we are calculating.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## uint256 RariFundManager.getCombinedUsdBalance()

Returns the fund's raw total balance (investor funds + unclaimed fees) of the specified currency.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## bool RariFundManager.deposit(string currencyCode, uint256 amount)

Deposits funds to RariFund in exchange for RFT.

Please note that you must approve RariFundManager to transfer of the necessary amount of tokens.

Parameters:
 - **currencyCode** (string): The current code of the token to be deposited.
 - **amount** (uint256): The amount of tokens to be deposited.

Return value: Boolean indicating success.

## bool RariFundManager.withdraw(string currencyCode, uint256 amount)

Withdraws funds from RariFund in exchange for RFT.

Please note that you must approve RariFundManager to burn of the necessary amount of RFT.

Parameters:
 - **currencyCode** (string): The current code of the token to be deposited.
 - **amount** (uint256): The amount of tokens to be deposited.

Return value: Boolean indicating success.

## uint256 RariFundManager.countPendingWithdrawals(string currencyCode)

Returns the number of pending withdrawals in the queue of the specified currency.

Parameters:
 - **currencyCode** (string): The current code of the pending withdrawals.

## uint256 RariFundManager.getPendingWithdrawalPayee(string currencyCode, uint256 index)

Returns the payee of a pending withdrawal of the specified currency.

Parameters:
 - **currencyCode** (string): The current code of the pending withdrawals.
 - **index** (uint256): The index of the pending withdrawal.

## uint256 RariFundManager.getPendingWithdrawalAmount(string currencyCode, uint256 index)

Returns the amount of a pending withdrawal of the specified currency.

Parameters:
 - **currencyCode** (string): The current code of the pending withdrawals.
 - **index** (uint256): The index of the pending withdrawal.

## uint256 RariFundManager.getTotalBalance(string currencyCode)

Returns the fund's total investor balance (combined balance of all users of the fund; unlike getRawTotalBalance, excludes unclaimed interest fees) of the specified currency.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## uint256 RariFundManager.getRawInterestAccrued(string currencyCode)

Returns the raw total amount of interest accrued by the fund as a whole (including the fees paid on interest).

Parameters:

 - **currencyCode** (string): The currency code of the interest to be calculated.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## uint256 RariFundManager.getInterestAccrued(string currencyCode)

Returns the amount of interest accrued by investors (excluding the fees taken on interest).

Parameters:

 - **currencyCode** (string): The currency code of the interest to be calculated.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## uint256 RariFundManager.getCombinedUsdInterestAccrued()

Returns the amount of interest accrued by investors across all currencies in USD (scaled by 1e18).

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

## uint256 RariFundManager.getInterestFeesGenerated(string currencyCode)

Returns the amount of interest fees accrued by beneficiaries.

Parameters:

 - **currencyCode** (string): The currency code of the interest fees to be calculated.

Development notes:

 - *Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.*

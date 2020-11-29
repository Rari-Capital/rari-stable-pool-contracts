# Rari Stable Pool: How to Use the Smart Contracts

The following document contains instructions on common usage of the Rari Stable Pool smart contracts' APIs.

* See [`API.md`](API.md) for a more detailed API reference on `RariFundController`, `RariFundManager`, `RariFundToken`, `RariFundPriceConsumer`, and `RariFundProxy`.
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RSPT.
* Smart contract ABIs are available in the `abi` properties of the JSON files in the `build` folder.

*If you're using JavaScript, don't waste your time directly integrating our smart contracts: the [Rari JavaScript SDK](https://github.com/Rari-Capital/rari-sdk) makes programmatic deposits and withdrawals as easy as just one line of code!*

## Stable Pool APY

* **Get current raw APY (before fees):**
    1. Get raw currency/subpool allocations (including unclaimed fees on interest): `(string[], uint256[], RariFundController.LiquidityPool[][], uint256[][], uint256[]) RariFundProxy.getRawFundBalancesAndPrices()` returns an array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, an array of arrays of corresponding balances at each pool index for each currency code, and an array of prices in USD (scaled by 1e18) for each currency code.
    2. Multiply the APY of each pool of each currency by its fund controller balance (converted to USD).
    3. Divide the sum of these products by the sum of all fund controller contract balances and pool balances of each currency (converted to USD) to get the current Stable Pool APY.
* **Get current APY (after fees):** subtract the product of the current raw APY and `uint256 RariFundManager.getInterestFeeRate()` divided by 1e18 from the current raw Stable Pool APY.
* **Get APY over time range (after fees):**
    1. Get RSPT exchange rates at start and end of time range: divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RSPT in USD (scaled by 1e18).
    2. Divide the ending exchange rate by the starting exchange rate, raise this quotient to the power of 1 year divided by the length of the time range, and subtract one to get the Stable Pool APY over this time range.

## My Balance and Interest

* **Get my USD balance supplied:** `uint256 RariFundManager.balanceOf(address account)` returns the total balance in USD (scaled by 1e18) supplied to the Rari Stable Pool by `account`.
* **Get my interest accrued:** Subtract total deposits and transfers in (in USD) and add total withdrawals and transfers out (in USD) from `uint256 RariFundManager.balanceOf(address account)`.

## Deposit

1. User chooses to deposit one of our directly supported tokens (DAI, USDC, USDT, TUSD, BUSD, and sUSD), ETH, or one of the tokens listed by the 0x swap tokens API (see [documentation](https://0x.org/docs/api#get-swapv0tokens) and [endpoint](https://api.0x.org/swap/v0/tokens)) in an amount no greater than the balance of their Ethereum account.
2. User calls `string[] RariFundManager.getAcceptedCurrencies()` to get an array of currency codes currently accepted for direct deposit to the Stable Pool.
    * If desired deposit currency is accepted:
        * Generally, user simply approves tokens and deposits them:
            1. User approves tokens to `RariFundManager` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundManager` (to approve unlimited funds, set `amount` to `uint256(-1)`).
            2. Deposit with `bool RariFundManager.deposit(string currencyCode, uint256 amount)`
        * To avoid paying gas, if the user's Ethereum account has no past deposit, the deposit amount is >= 250 USD, and the ETH balance returned by `RelayHub(0xd216153c06e857cd7f72665e0af1d7d82172f494).balanceOf(0xb6b79d857858004bf475e4a57d4a446da4884866)` is enough to cover the necessary gas, the user can submit their transaction via the Gas Station Network (GSN):
            1. User approves tokens to `RariFundProxy` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundProxy` (to approve unlimited funds, set `amount` to `uint256(-1)`).
            2. To get the necessary approval data (a signature from our trusted signer allowing the user to use our ETH for gas), POST the JSON body `{ from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress }` to `https://app.rari.capital/checkSig.php`.
                * Note that `checkSig.php` may go offline at some point in the future, in which case the user should deposit normally as described above.
            3. User calls `bool RariFundProxy.deposit(string currencyCode, uint256 amount)` via the Gas Station Network (GSN).
    * If desired deposit currency is not accepted, get exchange data from mStable (preferably) and/or 0x:
        * If desired deposit currency is DAI, USDC, USDT, TUSD, or mUSD, until the user fulfills their entire deposit, exchange to any depositable currency among DAI, USDC, USDT, TUSD, or mUSD via mStable and deposit:
            1. Get exchange data from mStable:
                * If desired deposit currency is DAI, USDC, USDT, or TUSD, check `(bool, string, uint256, uint256) MassetValidationHelper(0xabcc93c3be238884cc3309c19afd128fafc16911).getMaxSwap(0xe2f2a5c287993345a840db3b0845fbc70f5935a5, address _input, address _output)`. If the first returned value is `true`, the user can exchange a maximum input amount of the third returned value.
                * If desired deposit currency is mUSD, check `(bool, string, uint256 output, uint256 bassetQuantityArg) MassetValidationHelper(0xabcc93c3be238884cc3309c19afd128fafc16911).getRedeemValidity(0xabcc93c3be238884cc3309c19afd128fafc16911, uint256 _mAssetQuantity, address _outputBasset)`. If the first returned value is `true`, the user can exchange a maximum input amount of `bassetQuantityArg` (the fourth returned value).
            2. User calls `bool RariFundProxy.exchangeAndDeposit(string inputCurrencyCode, uint256 inputAmount, string outputCurrencyCode)` to exchange and deposit.
        * If exchange via mStable is not possible (or if the user wants to exchange the rest of their deposit via 0x if mStable cannot exchange it all), retrieve order data from 0x:
            1. User retrieves data from 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&sellAmount=1000000000000000000)) where:
                * `sellToken` is their input currency
                * `buyToken` is a directly depositable currency to which the desired deposit currency will be exchanged
                * `sellAmount` is the input amount to be sent by the user
            2. User approves tokens to `RariFundProxy` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundProxy` (to approve unlimited funds, set `amount` to `uint256(-1)`).
            3. User calls `bool RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)` where:
                * `orders` is the orders array returned by the 0x API
                * `signatures` in an array of signatures from the orders array returned by the 0x API
                * `takerAssetFillAmount` is the input amount sent by the user

## Withdraw

1. User ensures that their account possesses enough USD (represented internally by RSPT) to make their withdrawal.
2. User calls `uint256 RariFundManager.getRawFundBalance(string currencyCode)` to get the raw total balance (currently held by the Stable Pool and available for direct withdrawal) of the desired withdrawal currency.
    * If the returned balance >= withdrawal amount, user calls `bool RariFundManager.withdraw(string currencyCode, uint256 amount)`
    * If returned balance < withdrawal amount:
        1. Until the whole withdrawal amount (including the directly withdrawable balance returned above) is filled, try to withdraw and exchange each of the other currencies held by the Stable Pool (DAI, USDC, USDT, TUSD, BUSD, sUSD, and mUSD) to the desired output currency:
            1. User calls `uint256 RariFundManager.getRawFundBalance(string currencyCode)` to get the raw total balance held by the Stable Pool of the potential input currency in question.
            2. Get exchange data from mStable (preferably) and/or 0x:
                * If output currency is DAI, USDC, USDT, TUSD, or mUSD, get exchange data via mStable:
                    * If input currency is DAI, USDC, USDT, or TUSD, check `(bool, string, uint256, uint256) MassetValidationHelper(0xabcc93c3be238884cc3309c19afd128fafc16911).getMaxSwap(0xe2f2a5c287993345a840db3b0845fbc70f5935a5, address _input, address _output)`. If the first returned value is `true`, the user can exchange a maximum input amount of the third returned value.
                    * If input currency is mUSD, check `(bool, string, uint256 output, uint256 bassetQuantityArg) MassetValidationHelper(0xabcc93c3be238884cc3309c19afd128fafc16911).getRedeemValidity(0xabcc93c3be238884cc3309c19afd128fafc16911, uint256 _mAssetQuantity, address _outputBasset)`. If the first returned value is `true`, the user can exchange a maximum input amount of `bassetQuantityArg` (the fourth returned value).
                * If exchange via mStable is not possible (or if the user wants to exchange additional funds via 0x if mStable cannot exchange it all), retrieve order data from 0x:
                    * If the raw total balance of this input currency is enough to cover the remaining withdrawal amount, user retrieves data from the 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&buyAmount=1000000)) where:
                        * `sellToken` is the input currency to be directly withdrawn from the Stable Pool
                        * `buyToken` is the output currency to be sent to the user
                        * `buyAmount` is the amount of output currency to be sent to the user in this exchange only
                    * If the raw total balance of this input currency is not enough to cover the remaining withdrawal amount, user retrieves data from the 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&buyAmount=1000000)) where:
                        * `sellToken` is the input currency to be directly withdrawn from the Stable Pool
                        * `buyToken` is the output currency to be sent to the user
                        * `sellAmount` is the raw total balance of this input currency
        2. User calls `bool RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)` where:
            * `inputCurrencyCodes` is an array of input currency codes
                * To directly withdraw the output currency without exchange in the same transaction, simply include the output currency code in `inputCurrencyCodes`.
            * `inputAmounts` is an array of input currency amounts
                * To directly withdraw as much of the output currency without exchange in the same transaction, set the corresponding `inputAmounts` item to the directly withdrawable raw total balance of that currency.
            * `outputErc20Contract` is the ERC20 token contract address of the output currency to be sent to the user
            * `orders` is an array of orders arrays returned by the 0x API
                * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `orders` item to an empty array.
            * `signatures` is an array of arrays of signatures from the orders array returned by the 0x API
                * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `signatures` item to an empty array.
            * `makerAssetFillAmounts` is an array of output currency amounts to be sent to the user
                * To exchange one of `inputCurrencyCodes` via mStable or to directly withdraw the output currency in the same transaction, set the corresponding `makerAssetFillAmounts` item to 0.
            * `protocolFees` is an array of protocol fee amounts in ETH wei to be sent to 0x
                * To exchange one of `inputCurrencyCodes` via mStable instead of 0x or to directly withdraw the output currency in the same transaction, set the corresponding `protocolFees` item to 0.

## RSPT (Rari Stable Pool Token)

### Introduction

Your RSPT (Rari Stable Pool Token) balance is a *token-based representation of your Rari Stable Pool balance.*

* RSPT is minted to you when you deposit to the Stable Pool and redeemed (i.e., burned) when you withdraw from the Stable Pool.
* Accrued interest is constantly added to your USD balance supplied to the Stable Pool, meaning the USD value of your RSPT increases. However, your RSPT balance itself does not increase: instead, the exchange rate of RSPT increases at the same rate for every user as they accrue interest.
* When you transfer your RSPT, you transfer your holdings supplied to the Stable Pool (deposits + interest).

### Usage

* **Get RSPT exchange rate:** Divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RSPT in USD (scaled by 1e18).
* **Get my RSPT balance (internal representation of my USD balance supplied):** `uint256 RariFundToken.balanceOf(address account)` returns the amount of RSPT owned by `account`.
* **Transfer RSPT:** `bool RariFundToken.transfer(address recipient, uint256 amount)` transfers `amount` RSPT to `recipient` (as with other ERC20 tokens like RSPT).
* **Approve RSPT:** `bool RariFundToken.approve(address spender, uint256 amount)` approves `spender` to spend the specified `amount` of RSPT on behalf of `msg.sender`.
    * As with the `approve` functions of other ERC20 contracts, beware that changing an allowance with this method brings the risk that someone may use both the old and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RSPT.

## Total Supply and Interest

* **Get total USD supplied (by all users):** `uint256 RariFundManager.getFundBalance()` returns the total balance supplied by users to the Rari Stable Pool (all RSPT holders' funds but not unclaimed fees) in USD (scaled by 1e18).
* **Get total interest accrued (by all users):** `int256 RariFundManager.getInterestAccrued()` returns the total amount of interest accrued (excluding the fees paid on interest) by past and current Rari Stable Pool users (i.e., RSPT holders) in USD (scaled by 1e18).

## Fees

See [this Notion article](https://www.notion.so/Fees-e4689d7b800f485098548dd9e9d0a69f) for more information about fees and where they go.

### Performance Fees

Rari Capital currently takes a *9.5% performance fee* on all interest accrued by the Rari Stable Pool.

* This fee is liable to change in the future, but the following method returns its current value at any time.
* **Get interest fee rate:** `uint256 RariFundManager.getInterestFeeRate()` returns the fee rate on interest (proportion of raw interest accrued scaled by 1e18).

### Withdrawal Fees

Rari Capital currently takes a *0.5% withdrawal fee* on all withdrawals from the Rari Stable Pool.

* This fee is liable to change in the future, but the following method returns its current value at any time.
* **Get withdrawal fee rate:** `uint256 RariFundManager.getWithdrawalFeeRate()` returns the withdrawal fee rate (proportion of every withdrawal taken as a service fee scaled by 1e18).

## Raw Allocations

* **Get raw currency/subpool allocations (including unclaimed fees on interest) and prices:** `(string[], uint256[], RariFundController.LiquidityPool[][], uint256[][], uint256[]) RariFundProxy.getRawFundBalancesAndPrices()` returns an array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, an array of arrays of corresponding balances at each pool index for each currency code, and an array of prices in USD (scaled by 1e18) for each currency code.

## Internal Stablecoin Pricing

* **Get stablecoin prices (used internally by contracts):** `uint256[] RariFundPriceConsumer.getCurrencyPricesInUsd()` returns an array of prices in USD (scaled by 1e18) for all supported stablecoins to which funds can be allocated (DAI, USDC, USDT, TUSD, BUSD, sUSD, and mUSD, in that order).
    * Use these prices to calculate the value added to a user's USD balance due to a direct deposit and the value subtracted from a user's USD balance due to a direct withdrawal.

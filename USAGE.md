# How to Use the Smart Contracts

* The following document contains instructions on common usage of the smart contracts' APIs.
* See `API.md` for a more detailed API reference on `RariFundController`, `RariFundManager`, `RariFundToken`, and `RariFundProxy`.
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RFT.
* Smart contract ABIs are available in the `abi` properties of the JSON files in the `build` folder.

## Fund APY

* **Get current raw fund APY (before fees):**
    1. Get all raw fund balances (including unclaimed fees on interest): `(string[] memory, uint256[] memory, uint256[][] memory, uint256[][] memory) RariFundController.getAllBalances()` returns an array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, and an array of arrays of corresponding balances at each pool index for each currency code.
    2. Multiply the APY of each pool of each currency by its fund controller balance (converted to USD).
    3. Divide the sum of these products by the sum of all fund controller contract balances and pool balances of each currency (converted to USD) to get the current fund APY.
* **Get current fund APY (after fees):** subtract the product of the current raw fund APY and `uint256 RariFundManager.getInterestFeeRate()` divided by 1e18 from the current raw fund APY.
* **Get fund APY over time range (after fees):**
    1. Get RFT exchange rates at start and end of time range: divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RFT in USD (scaled by 1e18).
    2. Divide the ending exchange rate by the starting exchange rate, raise this quotient to the power of 1 year divided by the length of the time range, and subtract one to get the fund APY over this time range.

## My Balances and Interest

* **Get my USD balance supplied to fund:** `uint256 RariFundManager.balanceOf(address account)` returns the total balance in USD (scaled by 1e18) of `account`.
* **Get my RFT balance (internal representation of my USD balance supplied to fund):** `uint256 RariFundToken.balanceOf(address account)` returns the amount of RFT owned by `account`.
* **Get my interest accrued:** `int256 RariFundManager.interestAccruedBy(address account)` returns the total amount of interest accrued by `account` (excluding the fees paid on interest) in USD (scaled by 1e18).

## Deposit

1. User chooses to deposit one of our directly supported tokens (DAI, USDC, USDT, TUSD, BUSD, and sUSD), ETH, or one of the tokens listed by the 0x swap tokens API (see [documentation](https://0x.org/docs/api#get-swapv0tokens) and [endpoint](https://api.0x.org/swap/v0/tokens)) in an amount no greater than the balance of their Ethereum account.
2. User ensures that their deposit will not cause their account balance to breach the limit (currently *$350 USD*, though this figure will be raised).
3. User calls `string[] RariFundManager.getAcceptedCurrencies()` to get an array of currency codes currently accepted for direct deposit to the fund.
    * If desired deposit currency is accepted:
        * Generally, user simply approves tokens and deposits them:
            1. User approves tokens to `RariFundManager` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundManager` (to approve unlimited funds, set `amount` to `uint256(-1)`).
            2. Deposit with `bool RariFundManager.deposit(string currencyCode, uint256 amount)`
        * To avoid paying gas, if the user's Ethereum account has no past deposit, the deposit amount is >= 250 USD, and the ETH balance returned by `RelayHub(0xd216153c06e857cd7f72665e0af1d7d82172f494).balanceOf(0xb6b79d857858004bf475e4a57d4a446da4884866)` is enough to cover the necessary gas, the user can submit their transaction via the Gas Station Network (GSN):
            1. User approves tokens to `RariFundProxy` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundProxy` (to approve unlimited funds, set `amount` to `uint256(-1)`).
            2. To get the necessary approval data (a signature from our trusted signer allowing the user to use our ETH for gas), POST the JSON body `{ from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress }` to `https://app.rari.capital/checkSig.php`.
                * Note that `checkSig.php` may go offline at some point in the future, in which case the user should deposit normally as described above.
            3. User calls `bool RariFundProxy.deposit(string currencyCode, uint256 amount)` via the Gas Station Network (GSN).
    * If desired deposit currency is not accepted:
        1. User retrieves data from 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&sellAmount=1000000000000000000)) where:
            * `sellToken` is their input currency
            * `buyToken` is a directly depositable currency to which the input currency will be exchanged
            * `sellAmount` is the input amount to be sent by the user
        2. User approves tokens to `RariFundProxy` by calling `approve(address spender, uint256 amount)` on the ERC20 contract of the desired input token where `spender` is `RariFundProxy` (to approve unlimited funds, set `amount` to `uint256(-1)`).
        3. User calls `bool RariFundProxy.exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string outputCurrencyCode, LibOrder.Order[] orders, bytes[] signatures, uint256 takerAssetFillAmount)` where:
            * `orders` is the orders array returned by the 0x API
            * `signatures` in an array of signatures from the orders array returned by the 0x API
            * `takerAssetFillAmount` is the input amount sent by the user

## Withdraw

1. User ensures that their account possesses enough USD (represented internally by RFT) to make their withdrawal.
2. User approves RFT to `RariFundManager` by calling `bool RariFundToken.approve(address spender, uint256 amount)` where `spender` is `RariFundManager` (to approve unlimited RFT, set `amount` to `uint256(-1)`).
3. User calls `uint256 RariFundManager.getRawFundBalance(string currencyCode)` (where `currencyCode` is the one they want to withdraw) to get the raw fund balance available for direct withdrawal.
    * If the returned balance >= withdrawal amount, user calls `bool RariFundManager.withdraw(string currencyCode, uint256 amount)`
    * If returned balance < withdrawal amount:
        1. Until the whole withdrawal output amount (including the directly withdrawable balance returned above) is filled, get exchange data for each supported input currency (DAI, USDC, USDT, TUSD, BUSD, sUSD, and mUSD):
            1. User calls `uint256 RariFundManager.getRawFundBalance(string currencyCode)` to get the raw balance of this input currency in the fund (that can be directly withdrawn from the fund and exchanged to the desired output currency).
            2. Retrieve order data from 0x:
                * If the raw fund balance of this input currency is enough to cover the remaining withdrawal amount, user retrieves data from the 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&buyAmount=1000000)) where:
                * `sellToken` is the input currency to be directly withdrawn from the fund
                * `buyToken` is the output currency to be sent to the user
                * `buyAmount` is the amount of output currency to be sent to the user in this exchange only
                * If the raw fund balance of this input currency is not enough to cover the remaining withdrawal amount, user retrieves data from the 0x swap quote API (see [documentation](https://0x.org/docs/api#get-swapv0quote) and [endpoint](https://api.0x.org/swap/v0/quote?sellToken=DAI&buyToken=USDC&buyAmount=1000000)) where:
                * `sellToken` is the input currency to be directly withdrawn from the fund
                * `buyToken` is the output currency to be sent to the user
                * `sellAmount` is the raw fund balance of this input currency
        2. User calls `bool RariFundProxy.withdrawAndExchange(string[] inputCurrencyCodes, uint256[] inputAmounts, address outputErc20Contract, LibOrder.Order[][] orders, bytes[][] signatures, uint256[] makerAssetFillAmounts, uint256[] protocolFees)` where:
            * `inputCurrencyCodes` is an array of input currency codes
                * **To directly withdraw the output currency in the same transaction, set last array item to the output currency code.**
            * `inputAmounts` is an array of input currency amounts
                * **To directly withdraw the output currency in the same transaction, set last array item to the directly withdrawable raw fund balance.**
            * `outputErc20Contract` is the ERC20 token contract address of the output currency to be sent to the user
            * `orders` is an array of orders arrays returned by the 0x API
                * **To directly withdraw the output currency in the same transaction, set last array item to an empty array.**
            * `signatures` is an array of arrays of signatures from the orders array returned by the 0x API
                * **To directly withdraw the output currency in the same transaction, set last array item to an empty array.**
            * `makerAssetFillAmounts` is an array of output currency amounts to be sent to the user
                * **To directly withdraw the output currency in the same transaction, set last array item to 0.**
            * `protocolFees` is an array of protocol fee amounts in ETH wei to be sent to 0x
                * **To directly withdraw the output currency in the same transaction, set last array item to 0.**

## Rari Fund Token (RFT)

* Your Rari Fund Token balance is a *token-based representation of your fund balance.*
    * RFT is minted to you when you deposit to the fund and redeemed (i.e., burned) when you withdraw from the fund.
    * Accruing interest increases your USD fund balance, meaning the USD value of your RFT increases. However, your RFT balance itself does not increase: instead, the exchange rate of RFT increases at the same rate as every user's balance as they accrue interest.
    * When you transfer your RFT, you transfer your holdings supplied to the fund (deposits + interest).
* **Transfer RFT:** `bool RariFundToken.transfer(address recipient, uint256 amount)` transfers `amount` RFT to `recipient` (as with other ERC20 tokens like RFT).
* See [EIP-20: ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) for reference on all common functions of ERC20 tokens like RFT.
* **Get RFT exchange rate:** Divide `RariFundManager.getFundBalance()` by `RariFundToken.totalSupply()` to get the exchange rate of RFT in USD (scaled by 1e18).

## Fund Balances and Interest

* **Get total USD supplied (by all users):** `uint256 RariFundManager.getFundBalance()` returns the fund's total investor balance (all RFT holders' funds but not unclaimed fees) of all currencies in USD (scaled by 1e18).
* **Get total interest accrued (by all users):** `int256 RariFundManager.getInterestAccrued()` returns the total amount of interest accrued by past and current RFT holders (excluding the fees paid on interest) in USD (scaled by 1e18).
* **Get all raw fund balances and allocations (including unclaimed fees on interest):** `(string[] memory, uint256[] memory, uint256[][] memory, uint256[][] memory) RariFundController.getAllBalances()` returns an array of currency codes, an array of corresponding fund controller contract balances for each currency code, an array of arrays of pool indexes for each currency code, and an array of arrays of corresponding allocations at each pool index for each currency code.

## Fees on Interest

* Rari Capital currently takes a *20% performance fee* on all interest accrued by the fund.
* This fee is liable to change in the future, but the following method returns its current value at any time.
* **Get interest fee rate:** `uint256 RariFundManager.getInterestFeeRate()` returns the fee rate on interest (proportion of raw interest accrued scaled by 1e18).

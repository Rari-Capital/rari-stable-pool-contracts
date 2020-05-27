/**
 * @file
 * @author David Lucid <david@rari.capital>
 *
 * @section LICENSE
 *
 * All rights reserved to David Lucid of David Lucid LLC.
 * Any disclosure, reproduction, distribution or other use of this code by any individual or entity other than David Lucid of David Lucid LLC, unless given explicit permission by David Lucid of David Lucid LLC, is prohibited.
 *
 * @section DESCRIPTION
 *
 * This file includes the Ethereum contract code for RariFundManager, the primary contract powering Rari Capital's RariFund.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./lib/RariFundController.sol";
import "./RariFundToken.sol";

/**
 * @title RariFundManager
 * @dev This contract is the primary contract powering RariFund.
 * Anyone can deposit to the fund with deposit(string currencyCode, uint256 amount)
 * Anyone can withdraw their funds (with interest) from the fund with withdraw(string currencyCode, uint256 amount)
 */
contract RariFundManager is Ownable {
    using SafeMath for uint256;

    /**
     * @dev Boolean that, if true, disables deposits to and withdrawals from this RariFundManager.
     */
    bool private _fundDisabled;

    /**
     * @dev Address of the RariFundToken.
     */
    address private _rariFundTokenContract;

    /**
     * @dev Address of the rebalancer.
     */
    address private _rariFundRebalancerAddress;

    /**
     * @dev Maps ERC20 token contract addresses to their currency codes.
     */
    string[] private _supportedCurrencies;

    /**
     * @dev Maps ERC20 token contract addresses to their currency codes.
     */
    mapping(string => address) private _erc20Contracts;

    /**
     * @dev Maps arrays of supported pools to currency codes.
     */
    mapping(string => uint8[]) private _poolsByCurrency;

    /**
     * @dev Struct for a pending withdrawal.
     */
    struct PendingWithdrawal {
        address payee;
        uint256 amount;
    }

    /**
     * @dev Mapping of withdrawal queues to currency codes.
     */
    mapping(string => PendingWithdrawal[]) private _withdrawalQueues;

    /**
     * @dev Constructor that sets supported ERC20 token contract addresses and supported pools for each supported token.
     */
    constructor () public {
        // Add currencies
        addCurrency("DAI", 0x6B175474E89094C44Da98b954EedeAC495271d0F, [0, 1]); // dYdX and Compound
        addCurrency("USDC", 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48, [0, 1]); // dYdX and Compound
        addCurrency("USDT", 0xdac17f958d2ee523a2206206994597c13d831ec7, [1]); // Compound
    }

    /**
     * @dev Sets supported ERC20 token contract addresses and supported pools for each supported token.
     * @param currencyCode The currency code of the token.
     * @param erc20Contract The ERC20 contract of the token.
     * @param pools Array of supported pool IDs.
     */
    function addCurrency(string memory currencyCode, address erc20Contract, uint8[] pools) internal {
        _supportedCurrencies.push(currencyCode);
        _erc20Contracts[currencyCode] = erc20Contract;
        _poolsByCurrency["DAI"] = pools;
    }

    /**
     * @dev Fallback function to receive ETH to be used for gas fees.
     */
    function() external payable { }

    /**
     * @dev Emitted when RariFundManager is upgraded.
     */
    event FundManagerUpgraded(address newContract);

    /**
     * @dev Emitted when the RariFundToken of the RariFundManager is set.
     */
    event FundTokenSet(address newContract);

    /**
     * @dev Emitted when the rebalancer of the RariFundManager is set.
     */
    event FundRebalancerSet(address newAddress);

    /**
     * @dev Upgrades RariFundManager.
     * @param newContract The address of the new RariFundManager contract.
     */
    function upgradeFundManager(address payable newContract) external onlyOwner {
        // Update RariFundToken minter
        if (_rariFundTokenContract != address(0)) {
            RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
            rariFundToken.addMinter(newContract);
            rariFundToken.renounceMinter();
        }

        // Withdraw all tokens from all pools and transfers them to new FundManager
        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            string memory currencyCode = _supportedCurrencies[i];

            for (uint256 j = 0; j < _poolsByCurrency[currencyCode].length; j++)
                if (RariFundController.getPoolBalance(_poolsByCurrency[currencyCode][j], _erc20Contracts[currencyCode]) > 0)
                    RariFundController.withdrawAllFromPool(_poolsByCurrency[currencyCode][j], _erc20Contracts[currencyCode]);

            ERC20 token = ERC20(_erc20Contracts[currencyCode]);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) require(token.transfer(newContract, balance), "Failed to transfer tokens to new FundManager.");
        }

        // Forward ETH to new FundManager
        newContract.transfer(address(this).balance);

        emit FundManagerUpgraded(newContract);
    }

    /**
     * @dev Sets or upgrades the RariFundToken of the RariFundManager.
     * @param newContract The address of the new RariFundToken contract.
     */
    function setFundToken(address newContract) external onlyOwner {
        _rariFundTokenContract = newContract;
        emit FundTokenSet(newContract);
    }

    /**
     * @dev Sets or upgrades the rebalancer of the RariFundManager.
     * @param newAddress The Ethereum address of the new rebalancer server.
     */
    function setFundRebalancer(address newAddress) external onlyOwner {
        _rariFundRebalancerAddress = newAddress;
        emit FundRebalancerSet(newAddress);
    }

    /**
     * @dev Throws if called by any account other than the rebalancer.
     */
    modifier onlyRebalancer() {
        require(_rariFundRebalancerAddress == msg.sender, "Caller is not the rebalancer.");
        _;
    }

    /**
     * @dev Emitted when deposits to and withdrawals from this RariFundManager have been disabled.
     */
    event FundDisabled();

    /**
     * @dev Emitted when deposits to and withdrawals from this RariFundManager have been enabled.
     */
    event FundEnabled();

    /**
     * @dev Disables deposits to and withdrawals from this RariFundManager so contract(s) can be upgraded.
     */
    function disableFund() external onlyOwner {
        require(!_fundDisabled, "Fund already disabled.");
        _fundDisabled = true;
        emit FundDisabled();
    }

    /**
     * @dev Enables deposits to and withdrawals from this RariFundManager once contract(s) are upgraded.
     */
    function enableFund() external onlyOwner {
        require(_fundDisabled, "Fund already enabled.");
        _fundDisabled = false;
        emit FundEnabled();
    }

    /**
     * @notice Returns an account's total balance in USD (scaled by 1e18).
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     * @param account The account whose balance we are calculating.
     */
    function usdBalanceOf(address account) external returns (uint256) {
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        if (rftTotalSupply == 0) return 0;
        uint256 rftBalance = rariFundToken.balanceOf(account);
        uint256 totalUsdBalance = this.getCombinedUsdBalance(currencyCode);
        uint256 accountUsdBalance = rftBalance.mul(totalUsdBalance).div(rftTotalSupply);
        return accountUsdBalance;
    }

    /**
     * @dev Returns the fund's raw total balance (investor funds + unclaimed fees) of the specified currency.
     * Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by RariFundController.getPoolBalance) potentially modifies the state.
     * @param currencyCode The currency code of the balance to be calculated.
     */
    function getRawTotalBalance(string memory currencyCode) internal returns (uint256) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20 token = ERC20(erc20Contract);
        uint256 totalBalance = token.balanceOf(address(this));
        for (uint256 i = 0; i < _poolsByCurrency[currencyCode].length; i++) totalBalance = totalBalance.add(RariFundController.getPoolBalance(_poolsByCurrency[currencyCode][i], erc20Contract));
        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) totalBalance = totalBalance.sub(_withdrawalQueues[currencyCode][i].amount);

        return totalBalance;
    }

    /**
     * @notice Returns the fund's total balance of all currencies in USD (scaled by 1e18).
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getCombinedUsdBalance() public returns (uint256) {
        uint256 totalBalance = 0;

        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            string currencyCode = _supportedCurrencies[i];
            ERC20Detailed token = ERC20Detailed(_erc20Contracts[currencyCode]);
            uint256 tokenDecimals = token.decimals();
            uint256 balance = getTotalBalance(_supportedCurrencies[i]);
            uint256 balanceUsd = 18 >= tokenDecimals ? balance.mul(10 ** (18.sub(tokenDecimals))) : balance.div(10 ** (tokenDecimals.sub(18))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1
            totalBalance = totalBalance.add(balanceUsd);
        }

        return totalBalance;
    }

    /**
     * @dev Fund balance limit in USD per Ethereum address.
     */
    uint256 private _accountBalanceLimitUsd;

    /**
     * @dev Sets or upgrades the account balance limit in USD.
     * @param accountBalanceLimitUsd The fund balance limit in USD per Ethereum address.
     */
    function setAccountBalanceLimitUsd(uint256 accountBalanceLimitUsd) external onlyOwner {
        _accountBalanceLimitUsd = accountBalanceLimitUsd;
    }

    /**
     * @dev Emitted when funds have been deposited to RariFund.
     */
    event Deposit(string indexed currencyCode, address indexed sender, uint256 amount);

    /**
     * @dev Emitted when funds have been withdrawn from RariFund.
     */
    event Withdrawal(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @dev Emitted when funds have been queued for withdrawal from RariFund.
     */
    event WithdrawalQueued(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @notice Deposits funds to RariFund in exchange for RFT.
     * Please note that you must approve RariFundManager to transfer of the necessary amount of tokens.
     * @param currencyCode The current code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     * @return Boolean indicating success.
     */
    function deposit(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(!_fundDisabled, "Deposits to and withdrawals from the fund are currently disabled.");
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20Detailed token = ERC20Detailed(erc20Contract);
        uint256 tokenDecimals = token.decimals();
        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        uint256 rftAmount = 0;

        if (rftTotalSupply > 0) {
            uint256 amountUsd = 18 >= tokenDecimals ? amount.mul(10 ** (18.sub(tokenDecimals))) : amount.div(10 ** (tokenDecimals.sub(18)));
            rftAmount = amountUsd.mul(rftTotalSupply).div(this.getCombinedUsdBalance());
        } else {
            uint256 rftDecimals = rariFundToken.decimals();
            rftAmount = rftDecimals >= tokenDecimals ? amount.mul(10 ** (rftDecimals.sub(tokenDecimals))) : amount.div(10 ** (tokenDecimals.sub(rftDecimals)));
        }

        require(this.usdBalanceOf(msg.sender).add(amountUsd) <= _accountBalanceLimitUsd, "Making this deposit would cause this account's balance to exceed the maximum."); // TODO: Improve performance by not calling getCombinedUsdBalance() twice

        // Make sure the user must approve the transfer of tokens before calling the deposit function
        require(token.transferFrom(msg.sender, address(this), amount), "Failed to transfer input tokens.");
        _netDeposits[currencyCode] = _netDeposits[currencyCode].add(amount);
        require(rariFundToken.mint(msg.sender, rftAmount), "Failed to mint output tokens.");
        emit Deposit(currencyCode, msg.sender, amount);
        return true;
    }

    /**
     * @notice Withdraws funds from RariFund in exchange for RFT.
     * Please note that you must approve RariFundManager to burn of the necessary amount of RFT.
     * @param currencyCode The current code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdraw(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(!_fundDisabled, "Deposits to and withdrawals from the fund are currently disabled.");
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20Detailed token = ERC20Detailed(erc20Contract);
        uint256 tokenDecimals = token.decimals();
        uint256 contractBalance = token.balanceOf(address(this));

        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        uint256 totalUsdBalance = this.getCombinedUsdBalance(currencyCode);
        uint256 amountUsd = 18 >= tokenDecimals ? amount.mul(10 ** (18.sub(tokenDecimals))) : amount.div(10 ** (tokenDecimals.sub(18)));
        uint256 rftAmount = amount.mul(rftTotalSupply).div(totalUsdBalance);
        require(rftAmount <= rariFundToken.balanceOf(msg.sender), "Your RFT balance is too low for a withdrawal of this amount.");
        require(amountUsd <= totalUsdBalance, "Fund balance is too low for a withdrawal of this amount.");

        // Make sure the user must approve the burning of tokens before calling the withdraw function
        rariFundToken.burnFrom(msg.sender, rftAmount);
        _netDeposits[currencyCode] = _netDeposits[currencyCode].sub(amount);

        if (amount <= contractBalance) {
            require(token.transfer(msg.sender, amount), "Failed to transfer output tokens.");
            emit Withdrawal(currencyCode, msg.sender, amount);
        } else  {
            _withdrawalQueues[currencyCode].push(PendingWithdrawal(msg.sender, amount));
            emit WithdrawalQueued(currencyCode, msg.sender, amount);
        }

        return true;
    }

    /**
     * @dev Processes pending withdrawals in the queue for the specified currency.
     * @param currencyCode The currency code of the token for which to process pending withdrawals.
     * @return Boolean indicating success.
     */
    function processPendingWithdrawals(string calldata currencyCode) external returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        ERC20 token = ERC20(erc20Contract);
        uint256 balanceHere = token.balanceOf(address(this));
        uint256 total = 0;
        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) total = total.add(_withdrawalQueues[currencyCode][i].amount);
        if (total > balanceHere) revert("Not enough balance to process pending withdrawals.");

        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) {
            require(token.transfer(_withdrawalQueues[currencyCode][i].payee, _withdrawalQueues[currencyCode][i].amount));
            emit Withdrawal(currencyCode, _withdrawalQueues[currencyCode][i].payee, _withdrawalQueues[currencyCode][i].amount);
        }

        _withdrawalQueues[currencyCode].length = 0;
        return true;
    }

    /**
     * @notice Returns the number of pending withdrawals in the queue of the specified currency.
     * @param currencyCode The currency code of the pending withdrawals.
     */
    function countPendingWithdrawals(string calldata currencyCode) external view returns (uint256) {
        return _withdrawalQueues[currencyCode].length;
    }

    /**
     * @notice Returns the payee of a pending withdrawal of the specified currency.
     * @param currencyCode The currency code of the pending withdrawal.
     * @param index The index of the pending withdrawal.
     */
    function getPendingWithdrawalPayee(string calldata currencyCode, uint256 index) external view returns (address) {
        return _withdrawalQueues[currencyCode][index].payee;
    }

    /**
     * @notice Returns the amount of a pending withdrawal of the specified currency.
     * @param currencyCode The currency code of the pending withdrawal.
     * @param index The index of the pending withdrawal.
     */
    function getPendingWithdrawalAmount(string calldata currencyCode, uint256 index) external view returns (uint256) {
        return _withdrawalQueues[currencyCode][index].amount;
    }

    /**
     * @dev Approves tokens to the pool without spending gas on every deposit.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be approved.
     * @param amount The amount of tokens to be approved.
     * @return Boolean indicating success.
     */
    function approveToPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.approveToPool(pool, erc20Contract, amount), "Pool approval failed.");
        return true;
    }

    /**
     * @dev Deposits funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     * @return Boolean indicating success.
     */
    function depositToPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.depositToPool(pool, erc20Contract, amount), "Pool deposit failed.");
        return true;
    }

    /**
     * @dev Withdraws funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.withdrawFromPool(pool, erc20Contract, amount), "Pool withdrawal failed.");
        return true;
    }

    /**
     * @dev Withdraws all funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The ERC20 contract of the token to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawAllFromPool(uint8 pool, string calldata currencyCode) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.withdrawAllFromPool(pool, erc20Contract), "Pool withdrawal failed.");
        return true;
    }

    /**
     * @dev Fills 0x exchange orders up to a certain amount of input and up to a certain price.
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param maxInputAmount The maximum amount that we can input (balance of the asset).
     * @param minMarginalOutputAmount The minumum amount of output for each unit of input (scaled to 1e18) necessary to continue filling orders (i.e., a price ceiling).
     * @return Boolean indicating success.
     */
    function fill0xOrdersUpTo(string calldata inputCurrencyCode, string calldata outputCurrencyCode, LibOrder.Order[] calldata orders, bytes[] calldata signatures, uint256 maxInputAmount, uint256 minMarginalOutputAmount) external onlyRebalancer returns (bool) {
        require(orders.length > 0, "No orders supplied.");
        require(maxInputAmount > 0, "Maximum input amount must be greater than 0.");
        uint256[] filledAmounts = RariFundController.fill0xOrdersUpTo(orders, signatures, maxInputAmount, minMarginalOutputAmount);
        require(filledInputAmount > 0, "Filling orders via 0x failed.");
        _netExchanges[inputCurrencyCode].add(filledAmounts[0]);
        _netExchanges[outputCurrencyCode].sub(filledAmounts[1]);
        return true;
    }
    
    /**
     * @notice Returns the fund's total investor balance (combined balance of all users of the fund; unlike getRawTotalBalance, excludes unclaimed interest fees) of the specified currency.
     * @param currencyCode The currency code of the balance to be calculated.
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getTotalBalance(string memory currencyCode) public returns (uint256) {
        return getRawTotalBalance(currencyCode).sub(getInterestFeesUnclaimed(currencyCode));
    }

    /**
     * @dev Maps the net quantity of deposits (i.e., deposits - withdrawals) to each currency code.
     * On deposit, amount deposited is added to _netDeposits[currencyCode]; on withdrawal, amount withdrawn is subtracted from _netDeposits[currencyCode].
     */
    mapping(string => uint256) private _netDeposits;

    /**
     * @dev Maps the net quantity of exchanges (i.e., sold - bought) to each currency code.
     * On exchange to another currency, amount exchanged is added to _netExchanges[currencyCode]; on exchange from another currency, amount exchanged is subtracted from _netExchanges[currencyCode].
     */
    mapping(string => uint256) private _netExchanges;
    
    /**
     * @notice Returns the raw total amount of interest accrued by the fund as a whole (including the fees paid on interest).
     * @param currencyCode The currency code of the interest to be calculated.
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getRawInterestAccrued(string memory currencyCode) public returns (uint256) {
        return getRawTotalBalance(currencyCode).sub(_netDeposits[currencyCode]).add(_interestFeesClaimed[currencyCode]);
    }
    
    /**
     * @notice Returns the amount of interest accrued by investors (excluding the fees taken on interest).
     * @param currencyCode The currency code of the interest to be calculated.
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getInterestAccrued(string memory currencyCode) public returns (uint256) {
        return getTotalBalance(currencyCode).sub(_netDeposits[currencyCode]).add(_netExchanges[currencyCode]);
    }

    /**
     * @notice Returns the amount of interest accrued by investors across all currencies in USD (scaled by 1e18).
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getCombinedUsdInterestAccrued() public returns (uint256) {
        uint256 totalInterest = 0;

        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            string currencyCode = _supportedCurrencies[i];
            ERC20Detailed token = ERC20Detailed(_erc20Contracts[currencyCode]);
            uint256 tokenDecimals = token.decimals();
            uint256 interest = getInterestAccrued(_supportedCurrencies[i]);
            uint256 interestUsd = 18 >= tokenDecimals ? interest.mul(10 ** (18.sub(tokenDecimals))) : interest.div(10 ** (tokenDecimals.sub(18))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1
            totalInterest = totalInterest.add(interestUsd);
        }

        return totalInterest;
    }

    /**
     * @dev The proportion of interest accrued that is taken as a service fee (scaled by 1e18).
     */
    uint256 private _interestFeeRate;

    /**
     * @dev Sets the fee rate on interest.
     * @param rate The proportion of interest accrued to be taken as a service fee (scaled by 1e18).
     */
    function setInterestFeeRate(uint256 rate) external onlyOwner {
        require(rate != _interestFeeRate, "This is already the current interest fee rate.");

        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            string memory currencyCode = _supportedCurrencies[i];
            for (uint256 j = 0; j < _interestFeeShareBeneficiaries.length; j++) this.claimFees(currencyCode, _interestFeeShareBeneficiaries[j]);
            _interestFeesGeneratedAtLastFeeRateChange[currencyCode] = getInterestFeesGenerated(currencyCode); // MUST update this first before updating _rawInterestAccruedAtLastFeeRateChange since it depends on it 
            _rawInterestAccruedAtLastFeeRateChange[currencyCode] = getRawInterestAccrued(currencyCode);
        }

        _interestFeeRate = rate;
    }

    /**
     * @dev Returns the fee rate on interest.
     */
    function getInterestFeeRate() public view returns (uint256) {
        return _interestFeeRate;
    }

    /**
     * @dev The amount of interest accrued at the time of the most recent change to the fee rate.
     */
    mapping(string => uint256) private _rawInterestAccruedAtLastFeeRateChange;

    /**
     * @dev The amount of fees generated on interest at the time of the most recent change to the fee rate.
     */
    mapping(string => uint256) private _interestFeesGeneratedAtLastFeeRateChange;

    /**
     * @notice Returns the amount of interest fees accrued by beneficiaries.
     * @param currencyCode The currency code of the interest fees to be calculated.
     * @dev Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getInterestFeesGenerated(string memory currencyCode) public returns (uint256) {
        return _interestFeesGeneratedAtLastFeeRateChange[currencyCode].add(getRawInterestAccrued(currencyCode).sub(_rawInterestAccruedAtLastFeeRateChange[currencyCode]).mul(_interestFeeRate).div(1e18));
    }

    /**
     * @dev The total claimed amount of interest fees (shared + unshared).
     */
    mapping(string => uint256) private _interestFeesClaimed;

    /**
     * @dev Returns the total unclaimed amount of interest fees (shared + unshared).
     * @param currencyCode The currency code of the unclaimed interest fees to be calculated.
     * Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     */
    function getInterestFeesUnclaimed(string memory currencyCode) internal returns (uint256) {
        return getInterestFeesGenerated(currencyCode).sub(_interestFeesClaimed[currencyCode]);
    }

    /**
     * @dev Struct for an active share of interest fees.
     */
    struct InterestFeeShare { 
        uint256 shareProportion; // Proportion of interest fees shared/awarded to a beneficiary (scaled by 1e18); value of interest fees awarded = shareProportion * (getInterestFeesGenerated() - feesGeneratedWhenShareLastChanged)
        mapping(string => uint256) feesClaimedSinceShareLastChanged; // Claimed amount of fees on interest since share was created
        mapping(string => uint256) feesGeneratedWhenShareLastChanged; // getInterestFeesGenerated() at the time of creation of each share
    }

    /**
     * @dev Array of beneficiaries with active shares of interest fees.
     */
    address[] private _interestFeeShareBeneficiaries;

    /**
     * @dev Mapping of active shares of interest fees to beneficiaries.
     */
    mapping(address => InterestFeeShare) private _interestFeeShares;

    /**
     * @dev Emitted when an interest fee share is updated.
     */
    event InterestFeeShareUpdated(address beneficiary, uint256 shareProportion);

    /**
     * @dev Updates _interestFeeShareBeneficiaries and _interestFeeShares, running claimFees and resetting feesClaimedSinceShareLastChanged and feesGeneratedWhenShareLastChanged when changing a share proportion.
     * @param beneficiary The recipient of the fees.
     * @param shareProportion The proportion of interest fees that will be shared/awarded to the beneficiary (scaled by 1e18).
     */
    function setInterestFeeShare(address beneficiary, uint256 shareProportion) external onlyOwner {
        require(shareProportion >= 0, "Share proportion cannot be negative.");
        require(shareProportion != _interestFeeShares[beneficiary].shareProportion, "This share proportion is already set for this beneficary.");

        // If beneficiary has existing share proportion, claim their unclaimed fees and, if we are removing them, update the array; otherwise, add them to the array
        if (_interestFeeShares[beneficiary].shareProportion > 0) {
            for (uint256 i = 0; i < _supportedCurrencies.length; i++) this.claimFees(_supportedCurrencies[i], beneficiary);

            if (shareProportion == 0) {
                // Get index of beneficiary
                for (uint256 i = 0; i < _interestFeeShareBeneficiaries.length; i++) if (_interestFeeShareBeneficiaries[i] == beneficiary) {
                    // Remove beneficiary
                    for (uint256 j = i; j < _interestFeeShareBeneficiaries.length - 1; j++) _interestFeeShareBeneficiaries[j] = _interestFeeShareBeneficiaries[j + 1];
                    _interestFeeShareBeneficiaries.length--;
                }
            }
        } else _interestFeeShareBeneficiaries.push(beneficiary);

        // Set data in storage and emit event
        _interestFeeShares[beneficiary] = InterestFeeShare(shareProportion);
        for (uint256 i = 0; i < _supportedCurrencies.length; i++) _interestFeeShares[beneficiary].feesGeneratedWhenShareLastChanged[_supportedCurrencies[i]] = getInterestFeesGenerated(_supportedCurrencies[i]);
        emit InterestFeeShareUpdated(beneficiary, shareProportion);
    }

    /**
     * @dev Returns the total unclaimed amount of shared interest fees.
     * Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     * @param currencyCode The currency code of the unclaimed interest fees to be calculated.
     */
    function getSharedInterestFeesUnclaimed(string memory currencyCode) internal returns (uint256) {
        uint256 sharedInterestFeesUnclaimed = 0;
        for (uint256 i = 0; i < _interestFeeShareBeneficiaries.length; i++) sharedInterestFeesUnclaimed = sharedInterestFeesUnclaimed.add(getBeneficiarySharedInterestFeesUnclaimed(currencyCode, _interestFeeShareBeneficiaries[i]));
        return sharedInterestFeesUnclaimed;
    }

    /**
     * @dev Returns the unclaimed amount of shared interest fees belonging to a given beneficiary.
     * Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     * @param currencyCode The currency code of the unclaimed interest fees to be calculated.
     * @param beneficiary The recipient of the fees.
     */
    function getBeneficiarySharedInterestFeesUnclaimed(string memory currencyCode, address beneficiary) internal returns (uint256) {
        if (_interestFeeShares[beneficiary].shareProportion == 0) return 0;
        uint256 feesAwarded = getInterestFeesGenerated(currencyCode).sub(_interestFeeShares[beneficiary].feesGeneratedWhenShareLastChanged[currencyCode]).mul(_interestFeeShares[beneficiary].shareProportion).div(1e18);
        return feesAwarded.sub(_interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged[currencyCode]);
    }

    /**
     * @dev The master beneficiary of fees on interest; i.e., the recipient of all unshared fees on interest.
     */
    address private _interestFeeMasterBeneficiary;

    /**
     * @dev Sets the master beneficiary of interest fees.
     * @param beneficiary The master beneficiary of fees on interest; i.e., the recipient of all unshared fees on interest.
     */
    function setInterestFeeMasterBeneficiary(address beneficiary) external onlyOwner {
        require(beneficiary != address(0), "Interest fee master beneficiary cannot be the zero address.");
        _interestFeeMasterBeneficiary = beneficiary;
    }

    /**
     * @dev Returns the unclaimed amount of unshared interest fees (i.e., those belonging to the master beneficiary).
     * Ideally, we can add the view modifier, but Compound's getUnderlyingBalance function (called by getRawTotalBalance) potentially modifies the state.
     * @param currencyCode The currency code of the unclaimed interest fees to be calculated.
     */
    function getUnsharedInterestFeesUnclaimed(string memory currencyCode) internal returns (uint256) {
        return getInterestFeesUnclaimed(currencyCode).sub(getSharedInterestFeesUnclaimed(currencyCode));
    }

    /**
     * @dev Emitted when fees on interest are withdrawn.
     */
    event InterestFeesClaimed(string currencyCode, address beneficiary, uint256 amount);

    /**
     * @dev Withdraws all accrued fees on interest to a valid beneficiary.
     * @param currencyCode The currency code of the interest fees to be claimed.
     * @param beneficiary The recipient of the fees.
     * @return Boolean indicating success.
     */
    function claimFees(string calldata currencyCode, address beneficiary) external returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(beneficiary != address(0), "Beneficiary cannot be the zero address.");
        uint256 sharedFeesToClaim = getBeneficiarySharedInterestFeesUnclaimed(currencyCode, beneficiary);
        uint256 masterBeneficiaryInterestFeesUnclaimed = beneficiary == _interestFeeMasterBeneficiary ? getUnsharedInterestFeesUnclaimed(currencyCode) : 0;
        uint256 feesToClaim = sharedFeesToClaim.add(masterBeneficiaryInterestFeesUnclaimed);
        require(feesToClaim > 0, "No new fees are available for this beneficiary to claim.");
        _interestFeesClaimed[currencyCode] = _interestFeesClaimed[currencyCode].add(feesToClaim);
        if (_interestFeeShares[beneficiary].shareProportion > 0) _interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged[currencyCode] = _interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged[currencyCode].add(sharedFeesToClaim);        
        require(ERC20(erc20Contract).transfer(beneficiary, feesToClaim), "Failed to transfer fees to beneficiary.");
        emit InterestFeesClaimed(currencyCode, beneficiary, feesToClaim);
        return true;
    }
}

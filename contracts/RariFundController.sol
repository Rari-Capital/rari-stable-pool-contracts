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
 * This file includes the Ethereum contract code for RariFundController, our library handling deposits to and withdrawals from the liquidity pools that power RariFund as well as currency exchanges via 0x.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/drafts/SignedSafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";

import "./lib/pools/DydxPoolController.sol";
import "./lib/pools/CompoundPoolController.sol";
import "./lib/exchanges/ZeroExExchangeController.sol";

/**
 * @title RariFundController
 * @dev This contract handles deposits to and withdrawals from the liquidity pools that power RariFund as well as currency exchanges via 0x.
 */
contract RariFundController is Ownable {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using SafeERC20 for IERC20;

    /**
     * @dev Boolean that, if true, disables the primary functionality of this RariFundController.
     */
    bool private _fundDisabled;

    /**
     * @dev Address of the RariFundManager.
     */
    address private _rariFundManagerContract;

    /**
     * @dev Address of the rebalancer.
     */
    address private _rariFundRebalancerAddress;

    /**
     * @dev Array of currencies supported by the fund.
     */
    string[] private _supportedCurrencies;

    /**
     * @dev Maps ERC20 token contract addresses to supported currency codes.
     */
    mapping(string => address) private _erc20Contracts;

    /**
     * @dev Maps arrays of supported pools to currency codes.
     */
    mapping(string => uint8[]) private _poolsByCurrency;

    /**
     * @dev Constructor that sets supported ERC20 token contract addresses and supported pools for each supported token.
     */
    constructor () public {
        // Add supported currencies
        addSupportedCurrency("DAI", 0x6B175474E89094C44Da98b954EedeAC495271d0F);
        addPoolToCurrency("DAI", 0); // dYdX
        addPoolToCurrency("DAI", 1); // Compound
        addSupportedCurrency("USDC", 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
        addPoolToCurrency("USDC", 0); // dYdX
        addPoolToCurrency("USDC", 1); // Compound
        addSupportedCurrency("USDT", 0xdAC17F958D2ee523a2206206994597C13D831ec7);
        addPoolToCurrency("USDT", 1); // Compound
    }

    /**
     * @dev Marks a token as supported by the fund and stores its ERC20 contract address.
     * @param currencyCode The currency code of the token.
     * @param erc20Contract The ERC20 contract of the token.
     */
    function addSupportedCurrency(string memory currencyCode, address erc20Contract) internal {
        _supportedCurrencies.push(currencyCode);
        _erc20Contracts[currencyCode] = erc20Contract;
    }

    /**
     * @dev Adds a supported pool for a token.
     * @param currencyCode The currency code of the token.
     * @param pool Pool ID to be supported.
     */
    function addPoolToCurrency(string memory currencyCode, uint8 pool) internal {
        _poolsByCurrency[currencyCode].push(pool);
    }

    /**
     * @dev Payable fallback function called by 0x exchange to refund unspent protocol fee.
     */
    function () external payable { }

    /**
     * @dev Emitted when the RariFundManager of the RariFundController is set.
     */
    event FundManagerSet(address newAddress);

    /**
     * @dev Sets or upgrades the RariFundManager of the RariFundController.
     * @param newContract The address of the new RariFundManager contract.
     */
    function setFundManager(address newContract) external onlyOwner {
        // Approve maximum output tokens to RariFundManager
        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            IERC20 token = IERC20(_erc20Contracts[_supportedCurrencies[i]]);
            if (_rariFundManagerContract != address(0)) token.safeApprove(_rariFundManagerContract, 0);
            if (newContract != address(0)) token.safeApprove(newContract, uint256(-1));
        }

        _rariFundManagerContract = newContract;
        emit FundManagerSet(newContract);
    }

    /**
     * @dev Throws if called by any account other than the RariFundManager.
     */
    modifier onlyManager() {
        require(_rariFundManagerContract == msg.sender, "Caller is not the fund manager.");
        _;
    }

    /**
     * @dev Emitted when the rebalancer of the RariFundController is set.
     */
    event FundRebalancerSet(address newAddress);

    /**
     * @dev Sets or upgrades the rebalancer of the RariFundController.
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
     * @dev Emitted when the primary functionality of this RariFundController contract has been disabled.
     */
    event FundDisabled();

    /**
     * @dev Emitted when the primary functionality of this RariFundController contract has been enabled.
     */
    event FundEnabled();

    /**
     * @dev Disables primary functionality of this RariFundController so contract(s) can be upgraded.
     */
    function disableFund() external onlyOwner {
        require(!_fundDisabled, "Fund already disabled.");
        _fundDisabled = true;
        emit FundDisabled();
    }

    /**
     * @dev Enables primary functionality of this RariFundController once contract(s) are upgraded.
     */
    function enableFund() external onlyOwner {
        require(_fundDisabled, "Fund already enabled.");
        _fundDisabled = false;
        emit FundEnabled();
    }

    /**
     * @dev Throws if fund is disabled.
     */
    modifier fundEnabled() {
        require(!_fundDisabled, "This fund controller contract is disabled. This may be due to an upgrade.");
        _;
    }

    /**
     * @dev Returns the balances of all currencies supported by dYdX.
     * @return An array of ERC20 token contract addresses and a corresponding array of balances.
     */
    function getDydxBalances() external view returns (address[] memory, uint256[] memory) {
        return DydxPoolController.getBalances();
    }

    /**
     * @dev Returns the fund controller's balance of the specified currency in the specified pool.
     * @dev Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `CompoundPoolController.getBalance`) potentially modifies the state.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token.
     */
    function _getPoolBalance(uint8 pool, string memory currencyCode) public returns (uint256) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) return DydxPoolController.getBalance(erc20Contract);
        else if (pool == 1) return CompoundPoolController.getBalance(erc20Contract);
        else revert("Invalid pool index.");
    }

    /**
     * @dev Returns the fund controller's balance of the specified currency in the specified pool.
     * @dev Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `CompoundPoolController.getBalance`) potentially modifies the state.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token.
     */
    function getPoolBalance(uint8 pool, string memory currencyCode) public returns (uint256) {
        if (!_poolsWithFunds[currencyCode][pool]) return 0;
        return _getPoolBalance(pool, currencyCode);
    }

    /**
     * @notice Returns the fund controller's balance of each pool of the specified currency.
     * @dev Ideally, we can add the view modifier, but Compound's `getUnderlyingBalance` function (called by `getPoolBalance`) potentially modifies the state.
     * @param currencyCode The currency code whose balance is to be calculated.
     * @return An array of pool indexes and an array of corresponding balances.
     */
    function getPoolBalances(string calldata currencyCode) external returns (uint8[] memory, uint256[] memory) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        uint256[] memory balances = new uint256[](_poolsByCurrency[currencyCode].length);
        for (uint256 i = 0; i < _poolsByCurrency[currencyCode].length; i++) balances[i] = getPoolBalance(_poolsByCurrency[currencyCode][i], currencyCode);
        return (_poolsByCurrency[currencyCode], balances);
    }

    /**
     * @dev Approves tokens to the specified pool without spending gas on every deposit.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token to be approved.
     * @param amount The amount of tokens to be approved.
     * @return Boolean indicating success.
     */
    function approveToPool(uint8 pool, string calldata currencyCode, uint256 amount) external fundEnabled onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) require(DydxPoolController.approve(erc20Contract, amount), "Approval of tokens to dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.approve(erc20Contract, amount), "Approval of tokens to Compound failed.");
        else revert("Invalid pool index.");
        return true;
    }

    /**
     * @dev Mapping of bools indicating the presence of funds to pool indexes to currency codes.
     */
    mapping(string => mapping(uint8 => bool)) _poolsWithFunds;

    /**
     * @dev Return a boolean indicating if the fund controller has funds in `currencyCode` in `pool`.
     * @param pool The index of the pool to check.
     * @param currencyCode The currency code of the token to check.
     */
    function hasCurrencyInPool(uint8 pool, string calldata currencyCode) external view returns (bool) {
        return _poolsWithFunds[currencyCode][pool];
    }

    /**
     * @dev Deposits funds to the specified pool.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     * @return Boolean indicating success.
     */
    function depositToPool(uint8 pool, string calldata currencyCode, uint256 amount) external fundEnabled onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) require(DydxPoolController.deposit(erc20Contract, amount), "Deposit to dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.deposit(erc20Contract, amount), "Deposit to Compound failed.");
        else revert("Invalid pool index.");
        _poolsWithFunds[currencyCode][pool] = true;
        return true;
    }

    /**
     * @dev Internal function to withdraw funds from the specified pool.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function _withdrawFromPool(uint8 pool, string memory currencyCode, uint256 amount) internal {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) require(DydxPoolController.withdraw(erc20Contract, amount), "Withdrawal from dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.withdraw(erc20Contract, amount), "Withdrawal from Compound failed.");
        else revert("Invalid pool index.");
    }

    /**
     * @dev Withdraws funds from the specified pool.
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount) external fundEnabled onlyRebalancer returns (bool) {
        _withdrawFromPool(pool, currencyCode, amount);
        _poolsWithFunds[currencyCode][pool] = _getPoolBalance(pool, currencyCode) > 0;
        return true;
    }

    /**
     * @dev Withdraws funds from the specified pool (caching the `initialBalance` parameter).
     * @param pool The index of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @param initialBalance The fund's balance of the specified currency in the specified pool before the withdrawal.
     * @return Boolean indicating success.
     */
    function withdrawFromPoolKnowingBalance(uint8 pool, string calldata currencyCode, uint256 amount, uint256 initialBalance) external fundEnabled onlyManager returns (bool) {
        _withdrawFromPool(pool, currencyCode, amount);
        if (amount == initialBalance) _poolsWithFunds[currencyCode][pool] = false;
        return true;
    }

    /**
     * @dev Withdraws all funds from the specified pool.
     * @param pool The index of the pool.
     * @param currencyCode The ERC20 contract of the token to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawAllFromPool(uint8 pool, string calldata currencyCode) external fundEnabled onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) require(DydxPoolController.withdrawAll(erc20Contract), "Withdrawal from dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.withdrawAll(erc20Contract), "Withdrawal from Compound failed.");
        else revert("Invalid pool index.");
        _poolsWithFunds[currencyCode][pool] = false;
        return true;
    }

    /**
     * @dev Withdraws all funds from the specified pool (without requiring the fund to be enabled).
     * @param pool The index of the pool.
     * @param currencyCode The ERC20 contract of the token to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawAllFromPoolOnUpgrade(uint8 pool, string calldata currencyCode) external onlyManager returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        if (pool == 0) require(DydxPoolController.withdrawAll(erc20Contract), "Withdrawal from dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.withdrawAll(erc20Contract), "Withdrawal from Compound failed.");
        else revert("Invalid pool index.");
        _poolsWithFunds[currencyCode][pool] = false;
        return true;
    }

    /**
     * @dev Approves tokens to 0x without spending gas on every deposit.
     * @param erc20Contract The ERC20 contract address of the token to be approved.
     * @param amount The amount of tokens to be approved.
     * @return Boolean indicating success.
     */
    function approveTo0x(address erc20Contract, uint256 amount) external fundEnabled onlyRebalancer returns (bool) {
        require(ZeroExExchangeController.approve(erc20Contract, amount), "Approval of tokens to 0x failed.");
        return true;
    }

    /**
     * @dev Market sell to 0x exchange orders (reverting if `takerAssetFillAmount` is not filled).
     * We should be able to make this function external and use calldata for all parameters, but Solidity does not support calldata structs (https://github.com/ethereum/solidity/issues/5479).
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param takerAssetFillAmount The amount of the taker asset to sell (excluding taker fees).
     * @return Boolean indicating success.
     */
    function marketSell0xOrdersFillOrKill(LibOrder.Order[] memory orders, bytes[] memory signatures, uint256 takerAssetFillAmount) public payable fundEnabled onlyRebalancer returns (bool) {
        ZeroExExchangeController.marketSellOrdersFillOrKill(orders, signatures, takerAssetFillAmount, msg.value);
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) msg.sender.transfer(ethBalance);
        return true;
    }
}

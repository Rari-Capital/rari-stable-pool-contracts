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
 * This file includes the Ethereum contract code for RariFundController, our library handling deposits to and withdrawals from the liquidity pools that power RariFund.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "./pools/DydxPoolController.sol";
import "./pools/CompoundPoolController.sol";

/**
 * @title RariFundController
 * @dev This library handles deposits to and withdrawals from the liquidity pools that power RariFund.
 */
library RariFundController {
    using SafeMath for uint256;

    /**
     * @dev Returns the calling address's balance of the specified currency in the specified pool.
     * @param pool The name of the pool.
     * @param erc20Contract The ERC20 contract of the token.
     */
    function getPoolBalance(uint8 pool, address erc20Contract) internal returns (uint256) {
        if (pool == 0) return DydxPoolController.getBalance(erc20Contract);
        else if (pool == 1) return CompoundPoolController.getBalance(erc20Contract);
        else revert("Invalid pool index.");
    }

    /**
     * @dev Approves tokens to the pool without spending gas on every deposit.
     * @param pool The name of the pool.
     * @param erc20Contract The ERC20 contract of the token to be approved.
     * @param amount The amount of tokens to be approved.
     * @return Boolean indicating success.
     */
    function approveToPool(uint8 pool, address erc20Contract, uint256 amount) internal returns (bool) {
        if (pool == 0) require(DydxPoolController.approve(erc20Contract, amount), "Approval of tokens to dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.approve(erc20Contract, amount), "Approval of tokens to Compound failed.");
        else revert("Invalid pool index.");
        return true;
    }

    /**
     * @dev Deposits funds to the specified pool.
     * @param pool The name of the pool.
     * @param erc20Contract The ERC20 contract of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     * @return Boolean indicating success.
     */
    function depositToPool(uint8 pool, address erc20Contract, uint256 amount) internal returns (bool) {
        if (pool == 0) require(DydxPoolController.deposit(erc20Contract, amount), "Deposit to dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.deposit(erc20Contract, amount), "Deposit to Compound failed.");
        else revert("Invalid pool index.");
        return true;
    }

    /**
     * @dev Withdraws funds from the specified pool.
     * @param pool The name of the pool.
     * @param erc20Contract The ERC20 contract of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawFromPool(uint8 pool, address erc20Contract, uint256 amount) internal returns (bool) {
        if (pool == 0) require(DydxPoolController.withdraw(erc20Contract, amount), "Withdrawal from dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.withdraw(erc20Contract, amount), "Withdrawal from Compound failed.");
        else revert("Invalid pool index.");
        return true;
    }

    /**
     * @dev Withdraws all funds from the specified pool.
     * @param pool The name of the pool.
     * @param erc20Contract The ERC20 contract of the token to be withdrawn.
     * @return Boolean indicating success.
     */
    function withdrawAllFromPool(uint8 pool, address erc20Contract) internal returns (bool) {
        if (pool == 0) require(DydxPoolController.withdrawAll(erc20Contract), "Withdrawal from dYdX failed.");
        else if (pool == 1) require(CompoundPoolController.withdrawAll(erc20Contract), "Withdrawal from Compound failed.");
        else revert("Invalid pool index.");
        return true;
    }
}

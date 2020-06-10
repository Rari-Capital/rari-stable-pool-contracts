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
 * This file includes the Ethereum contract code for ZeroExExchangeController, a library handling exchanges via 0x.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";

/**
 * @title ZeroExExchangeController
 * @dev This library handles exchanges via 0x.
 */
library ZeroExExchangeController {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    
    address constant private EXCHANGE_CONTRACT = 0x61935CbDd02287B511119DDb11Aeb42F1593b7Ef;
    IExchange constant private _exchange = IExchange(EXCHANGE_CONTRACT);
    address constant private ERC20_PROXY_CONTRACT = 0x95E6F48254609A6ee006F7D493c8e5fB97094ceF;

    /**
     * @dev Approves tokens to 0x without spending gas on every deposit.
     * @param erc20Contract The ERC20 contract address of the token.
     * @param amount Amount of the specified token to approve to dYdX.
     * @return Boolean indicating success.
     */
    function approve(address erc20Contract, uint256 amount) internal returns (bool) {
        IERC20 token = IERC20(erc20Contract);
        uint256 allowance = token.allowance(address(this), ERC20_PROXY_CONTRACT);
        if (amount < allowance) token.safeDecreaseAllowance(ERC20_PROXY_CONTRACT, allowance - amount);
        else if (amount > allowance) token.safeIncreaseAllowance(ERC20_PROXY_CONTRACT, amount - allowance);
        return true;
    }

    /**
     * @dev Fills 0x exchange orders up to a certain amount of input and up to a certain price.
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param takerAssetFillAmount The amount of the taker asset to sell (excluding taker fees).
     * @return Array containing the input amount sold and output amount bought.
     */
    function fillOrdersUpTo(LibOrder.Order[] memory orders, bytes[] memory signatures, uint256 takerAssetFillAmount) internal returns (uint256[2] memory) {
        require(orders.length > 0, "At least one order and matching signature is required.");
        require(orders.length == signatures.length, "Mismatch between number of orders and signatures.");
        require(takerAssetFillAmount > 0, "Taker asset fill amount must be greater than 0.");
        LibFillResults.FillResults memory fillResults = _exchange.marketSellOrdersNoThrow.value(msg.value)(orders, takerAssetFillAmount, signatures);
        return [fillResults.takerAssetFilledAmount, fillResults.makerAssetFilledAmount];
    }
}

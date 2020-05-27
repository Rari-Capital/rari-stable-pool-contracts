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
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";

/**
 * @title ZeroExExchangeController
 * @dev This library handles exchanges via 0x.
 */
library ZeroExExchangeController {
    using SafeMath for uint256;

    address constant private EXCHANGE_CONTRACT = 0x61935cbdd02287b511119ddb11aeb42f1593b7ef;
    IExchange constant private _exchange = IExchange(EXCHANGE_CONTRACT);

    /**
     * @dev Fills 0x exchange orders up to a certain amount of input and up to a certain price.
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param maxInputAmount The maximum amount that we can input (balance of the asset).
     * @param minMarginalOutputAmount The minumum amount of output for each unit of input (scaled to 1e18) necessary to continue filling orders (i.e., a price ceiling).
     * @return Input amount sold and output amount bought.
     */
    function fillOrdersUpTo(LibOrder.Order[] memory orders, bytes[] memory signatures, uint256 memory maxInputAmount, uint256 memory minMarginalOutputAmount) internal returns (bool) {
        require(orders.length > 0, "At least one order and matching signature is required.");
        require(orders.length == signatures.length, "Mismatch between number of orders and signatures.");

        uint256 filledInputAmount = 0;
        uint256 filledOutputAmount = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].makerAssetAmount < orders[i].takerAssetAmount.mul(minMarginalOutputAmount).div(1e18)) break;
            LibFillResults.FillResults memory fillResults = _exchange.fillOrder(orders[i], maxInputAmount.sub(filledInputAmount), signatures[i]);
            filledInputAmount = filledInputAmount.add(fillResults.takerAssetFilledAmount);
            filledOutputAmount = filledOutputAmount.add(fillResults.makerAssetFilledAmount);
            if (filledInputAmount == maxInputAmount) break;
        }
        
        return [filledInputAmount, filledOutputAmount];
    }
}

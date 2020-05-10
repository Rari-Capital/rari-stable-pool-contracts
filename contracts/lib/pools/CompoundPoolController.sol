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
 * This file includes the Ethereum contract code for CompoundPoolController, a library handling deposits to and withdrawals from dYdX liquidity pools.
 */

pragma solidity ^0.5.7;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../../external/compound/CErc20.sol";

/**
 * @title CompoundPoolController
 * @dev This library handles deposits to and withdrawals from dYdX liquidity pools.
 */
library CompoundPoolController {
    using SafeMath for uint256;

    /**
     * @dev Returns a token's cToken contract address given its ERC20 contract address.
     * @param erc20Contract The ERC20 contract address of the token.
     */
    function getCErc20Address(address erc20Contract) private pure returns (address) {
        if (erc20Contract == 0x6B175474E89094C44Da98b954EedeAC495271d0F) return 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643; // DAI => cDAI
        else revert("Supported Compound cToken address not found for this token address.");
    }

    /**
     * @dev Retrieves the calling address's balance of the specified currency in the Compound pool.
     * @param erc20Contract The ERC20 contract address of the token.
     */
    function getBalance(address erc20Contract) internal returns (uint256) {
        address cErc20Contract = getCErc20Address(erc20Contract); // TODO: Make sure this reverts if an invalid address is supplied
        return CErc20(cErc20Contract).balanceOfUnderlying(address(this));
    }

    /**
     * @dev Deposits funds to the Compound pool.
     * @param erc20Contract The ERC20 contract address of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     */
    function deposit(address erc20Contract, uint256 amount) internal returns (bool) {
        address cErc20Contract = getCErc20Address(erc20Contract);
        ERC20 underlying = ERC20(erc20Contract);
        require(underlying.approve(cErc20Contract, amount)); // TODO: Execute infinite approval once instead of approving every time we deposit so we don't waste gas?
        uint256 mintResult = CErc20(cErc20Contract).mint(amount);
        require(mintResult == 0, "Error calling mint on Compound cToken: error code not equal to 0");
        return true;
    }

    /**
     * @dev Withdraws funds from the Compound pool.
     * @param erc20Contract The ERC20 contract address of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function withdraw(address erc20Contract, uint256 amount) internal returns (bool) {
        address cErc20Contract = getCErc20Address(erc20Contract);
        uint256 redeemResult = CErc20(cErc20Contract).redeemUnderlying(amount);
        require(redeemResult == 0, "Error calling redeemUnderlying on Compound cToken: error code not equal to 0");
        return true;
    }

    /**
     * @dev Withdraws all funds from the Compound pool.
     * @param erc20Contract The ERC20 contract address of the token to be withdrawn.
     */
    function withdrawAll(address erc20Contract) internal returns (bool) {
        address cErc20Contract = getCErc20Address(erc20Contract);
        uint256 balance = ERC20(cErc20Contract).balanceOf(address(this));
        if (balance == 0) return false; // TODO: Or revert("No funds available to redeem from Compound cToken.")
        uint256 redeemResult = CErc20(cErc20Contract).redeem(balance);
        require(redeemResult == 0, "Error calling redeem on Compound cToken: error code not equal to 0");
        return true;
    }
}

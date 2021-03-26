/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "../../external/mstable/IMasset.sol";

/**
 * @title MStableExchangeController
 * @author David Lucid <david@rari.capital> (https://github.com/davidlucid)
 * @dev This library handles minting and redeeming of mStable's mUSD token.
 */
library MStableExchangeController {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address constant private MUSD_TOKEN_CONTRACT = 0xe2f2a5C287993345a840Db3B0845fbC70f5935a5;
    IMasset constant private _mUsdToken = IMasset(MUSD_TOKEN_CONTRACT);

    /**
     * @dev Approves tokens to the mUSD token contract without spending gas on every deposit.
     * @param erc20Contract The ERC20 contract address of the token.
     * @param amount Amount of the specified token to approve to the mUSD token contract.
     */
    function approve(address erc20Contract, uint256 amount) external {
        IERC20 token = IERC20(erc20Contract);
        uint256 allowance = token.allowance(address(this), MUSD_TOKEN_CONTRACT);
        if (allowance == amount) return;
        if (amount > 0 && allowance > 0) token.safeApprove(MUSD_TOKEN_CONTRACT, 0);
        token.safeApprove(MUSD_TOKEN_CONTRACT, amount);
        return;
    }

    /**
     * @dev Mints mUSD tokens in exchange for the specified amount of the specified token.
     * @param erc20Contract The ERC20 contract address of the token to be exchanged.
     * @param inputAmount The amount of input tokens to be exchanged for mUSD.
     * @param minOutputAmount The minimum amount of output mUSD tokens.
     * @return The amount of mUSD tokens minted.
     */
    function mint(address erc20Contract, uint256 inputAmount, uint256 minOutputAmount) external returns (uint256) {
        require(inputAmount > 0, "Input amount must be greater than 0.");
        uint256 mAssetMinted = _mUsdToken.mint(erc20Contract, inputAmount, minOutputAmount, address(this));
        require(mAssetMinted > minOutputAmount, "Error calling mint on mStable mUSD token: output mUSD amount not greater than minimum.");
        return mAssetMinted;
    }

    /**
     * @dev Redeems mUSD tokens in exchange for the specified amount of the specified token.
     * @param erc20Contract The ERC20 contract address of the token to be withdrawn.
     * @param inputAmount The amount of input mUSD to be exchanged for output bAsset tokens.
     * @param minOutputAmount The minimum amount of output bAsset tokens.
     * @return The amount of mUSD tokens redeemed.
     */
    function redeem(address erc20Contract, uint256 inputAmount, uint256 minOutputAmount) external returns (uint256) {
        require(inputAmount > 0, "Input amount must be greater than 0.");
        uint256 outputRedeemed = _mUsdToken.redeem(erc20Contract, inputAmount, minOutputAmount, address(this));
        require(outputRedeemed > minOutputAmount, "Error calling redeem on mStable mUSD token: output bAsset amount not greater than minimum.");
        return outputRedeemed;
    }

    /**
     * @dev Swaps the specified amount of the specified input bAsset token in exchange for the specified output bAsset token.
     * @param inputErc20Contract The ERC20 contract address of the input bAsset token to be exchanged for output bAsset tokens.
     * @param outputErc20Contract The ERC20 contract address of the output bAsset token to be exchanged from input bAsset tokens.
     * @param inputAmount The amount of input bAsset tokens to be exchanged for output bAsset tokens.
     * @param minOutputAmount The minimum amount of output bAsset tokens.
     * @return The amount of output bAsset tokens.
     */
    function swap(address inputErc20Contract, address outputErc20Contract, uint256 inputAmount, uint256 minOutputAmount) external returns (uint256) {
        require(inputAmount > 0, "Input amount must be greater than 0.");
        uint256 outputAmount = _mUsdToken.swap(inputErc20Contract, outputErc20Contract, inputAmount, minOutputAmount, address(this));
        require(outputAmount > minOutputAmount, "Error calling swap on mStable mUSD token: output bAsset amount not greater than minimum.");
        return outputAmount;
    }
}

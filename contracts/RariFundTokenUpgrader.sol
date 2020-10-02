/**
 * COPYRIGHT © 2020 RARI CAPITAL, INC. ALL RIGHTS RESERVED.
 * Anyone is free to integrate the public (i.e., non-administrative) application programming interfaces (APIs) of the official Ethereum smart contract instances deployed by Rari Capital, Inc. in any application (commercial or noncommercial and under any license), provided that the application does not abuse the APIs or act against the interests of Rari Capital, Inc.
 * Anyone is free to study, review, and analyze the source code contained in this package.
 * Reuse (including deployment of smart contracts other than private testing on a private network), modification, redistribution, or sublicensing of any source code contained in this package is not permitted without the explicit permission of David Lucid of Rari Capital, Inc.
 * No one is permitted to use the software for any purpose other than those allowed by this license.
 * This license is liable to change at any time at the sole discretion of David Lucid of Rari Capital, Inc.
 */

pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "./RariFundToken.sol";

/**
 * @title RariFundTokenUpgrader
 * @author David Lucid <david@rari.capital> (https://github.com/davidlucid)
 * @notice RariFundTokenUpgrader is a temporary minter of RariFundToken that duplicates the balances from the old RariFundToken.
 */
contract RariFundTokenUpgrader {
    /**
     * @dev ERC20 interface for the old RariFundToken.
     */
    IERC20 public oldFundToken;

    /**
     * @dev Contract of the new RariFundToken.
     */
    RariFundToken public newFundToken;

    /**
     * @dev Boolean indicating if the upgrade process is finished.
     */
    bool public finished = false;

    /**
     * @dev Maps accounts to bools indicating if they have been upgraded.
     */
    mapping(address => bool) _accountsUpgraded;

    /**
     * @dev Constructor for RariFundTokenUpgrader.
     */
    constructor (address _oldFundToken, address _newFundToken) public {
        require(_oldFundToken != address(0) && _newFundToken != address(0), "Neither fund token address can be the zero address.");
        oldFundToken = IERC20(_oldFundToken);
        newFundToken = RariFundToken(_newFundToken);
    }

    /**
     * @dev Upgrades balances of `accounts` from `oldFundToken` to `newFundToken`.
     * No account can be upgraded twice, and no account can be upgraded with a zero balance. Cannot upgrade if `finished` is true. Marks `finished` to true and renounces minter privileges when done upgrading.
     */
    function upgrade(address[] calldata accounts) external {
        // Make sure upgrade is not already complete
        require(!finished, "Upgrade already complete.");

        // Mint balances on `newFundToken` as long as none are in `_accountsUpgraded` and all balances > 0
        for (uint256 i = 0; i < accounts.length; i++) {
            require(!_accountsUpgraded[accounts[i]], "At least one of these accounts has already been upgraded.");
            uint256 balance = oldFundToken.balanceOf(accounts[i]);
            require(balance > 0, "At least one of these accounts has a zero balance.");
            _accountsUpgraded[accounts[i]] = true;
            newFundToken.mint(accounts[i], balance);
        }

        // If done upgrading, mark `finished` to true and renounces minter privileges
        if (newFundToken.totalSupply() == oldFundToken.totalSupply()) {
            newFundToken.renounceMinter();
            finished = true;
        }
    }
}

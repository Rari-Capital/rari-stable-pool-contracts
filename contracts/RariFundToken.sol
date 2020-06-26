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
 * This file includes the Ethereum contract code for RariFundToken, the ERC20 token contract accounting for the ownership of the funds invested in Rari Capital's RariFund.
 */

pragma solidity ^0.5.7;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./erc20/ERC20.sol";
import "./erc20/ERC20Mintable.sol";
import "./erc20/ERC20Burnable.sol";

/**
 * @title RariFundToken
 * @dev RariFundToken is the ERC20 token contract accounting for the ownership of RariFund's funds.
 */
contract RariFundToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable {
    using SafeMath for uint256;

    /**
     * @dev Constructor for RariFundToken.
     */
    constructor () public ERC20Detailed("Rari Fund Token", "RFT", 18) { }
}

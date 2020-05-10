pragma solidity ^0.5.7;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @title RariFundToken
 * @dev RariFundToken is the ERC20 token contract accounting for the ownership of RariFund's funds.
 */
contract RariFundToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable {
    using SafeMath for uint256;

    uint8 public constant DECIMALS = 18;

    /**
     * @dev Constructor for RariFundToken.
     */
    constructor () public ERC20Detailed("Rari Fund Token", "RFT", DECIMALS) { }
}

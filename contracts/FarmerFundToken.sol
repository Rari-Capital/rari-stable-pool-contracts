pragma solidity ^0.5.7;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/**
 * @title FarmerFundToken
 * @dev FarmerFundToken is the ERC20 token contract accounting for the ownership of FarmerFund's funds.
 */
contract FarmerFundToken is ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable {
    using SafeMath for uint256;

    uint8 public constant DECIMALS = 18;

    /**
     * @dev Constructor for FarmerFundToken.
     */
    constructor () public ERC20Detailed("FarmerFundToken", "FFT", DECIMALS) { }
}

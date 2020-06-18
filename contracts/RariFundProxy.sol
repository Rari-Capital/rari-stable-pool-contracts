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
 * This file includes the Ethereum contract code for RariFundProxy, which faciliates pre-deposit exchanges and post-withdrawal exchanges.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/drafts/SignedSafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";

import "./lib/exchanges/ZeroExExchangeController.sol";
import "./RariFundManager.sol";

/**
 * @title RariFundProxy
 * @dev This contract faciliates deposits to RariFundManager from exchanges and withdrawals from RariFundManager for exchanges.
 */
contract RariFundProxy is Ownable {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using SafeERC20 for IERC20;

    /**
     * @dev Array of currencies supported by the fund.
     */
    string[] private _supportedCurrencies;

    /**
     * @dev Maps ERC20 token contract addresses to supported currency codes.
     */
    mapping(string => address) private _erc20Contracts;

    /**
     * @dev Constructor that sets supported ERC20 token contract addresses.
     */
    constructor () public {
        // Add supported currencies
        addSupportedCurrency("DAI", 0x6B175474E89094C44Da98b954EedeAC495271d0F);
        addSupportedCurrency("USDC", 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
        addSupportedCurrency("USDT", 0xdAC17F958D2ee523a2206206994597C13D831ec7);
    }

    /**
     * @dev Marks a token as supported by the fund, stores its ERC20 contract address, and approves the maximum amount to 0x.
     * @param currencyCode The currency code of the token.
     * @param erc20Contract The ERC20 contract of the token.
     */
    function addSupportedCurrency(string memory currencyCode, address erc20Contract) internal {
        _supportedCurrencies.push(currencyCode);
        _erc20Contracts[currencyCode] = erc20Contract;
        ZeroExExchangeController.approve(erc20Contract, uint256(-1));
    }

    /**
     * @dev Address of the RariFundManager.
     */
    address payable private _rariFundManagerContract;

    /**
     * @dev Emitted when the RariFundManager of the RariFundProxy is set.
     */
    event FundManagerSet(address newContract);

    /**
     * @dev Sets or upgrades the RariFundManager of the RariFundProxy.
     * @param newContract The address of the new RariFundManager contract.
     */
    function setFundManager(address payable newContract) external onlyOwner {
        // Approve maximum output tokens to RariFundManager for deposit
        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            IERC20 token = IERC20(_erc20Contracts[_supportedCurrencies[i]]);
            if (_rariFundManagerContract != address(0)) token.safeDecreaseAllowance(_rariFundManagerContract, uint256(-1));
            token.safeIncreaseAllowance(newContract, uint256(-1));
        }

        _rariFundManagerContract = newContract;
        emit FundManagerSet(newContract);
    }

    address constant private WETH_CONTRACT = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IEtherToken constant private _weth = IEtherToken(WETH_CONTRACT);

    /**
     * @dev Payable fallback function called by 0x exchange to refund unspent protocol fee.
     */
    function () external payable { }

    /**
     * @dev Emitted when funds have been exchanged before being deposited via RariFundManager.
     * If exchanging from ETH, `inputErc20Contract` = address(0).
     */
    event PreDepositExchange(address indexed inputErc20Contract, string indexed outputCurrencyCode, address indexed payee, uint256 makerAssetFilledAmount, uint256 depositAmount);

    /**
     * @dev Emitted when funds have been exchanged after being withdrawn via RariFundManager.
     * If exchanging from ETH, `outputErc20Contract` = address(0).
     */
    event PostWithdrawalExchange(string indexed inputCurrencyCode, address indexed outputErc20Contract, address indexed payee, uint256 withdrawalAmount, uint256 takerAssetFilledAmount);

    /**
     * @notice Exchanges and deposits funds to RariFund in exchange for RFT.
     * Please note that you must approve RariFundProxy to transfer at least `inputAmount` unless you are inputting ETH.
     * You also must input at least enough ETH to cover the protocol fee (and enough to cover `orders` if you are inputting ETH).
     * @dev We should be able to make this function external and use calldata for all parameters, but Solidity does not support calldata structs (https://github.com/ethereum/solidity/issues/5479).
     * @param inputErc20Contract The ERC20 contract address of the token to be exchanged. Set to address(0) to input ETH.
     * @param inputAmount The amount of tokens to be exchanged (including taker fees).
     * @param outputCurrencyCode The currency code of the token to be deposited after exchange.
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param takerAssetFillAmount The amount of the taker asset to sell (excluding taker fees).
     * @return Boolean indicating success.
     */
    function exchangeAndDeposit(address inputErc20Contract, uint256 inputAmount, string memory outputCurrencyCode, LibOrder.Order[] memory orders, bytes[] memory signatures, uint256 takerAssetFillAmount) public payable returns (bool) {
        // Input validation
        require(_rariFundManagerContract != address(0), "RariFundManager contract not set.");
        require(inputAmount > 0, "Input amount must be greater than 0.");
        address outputErc20Contract = _erc20Contracts[outputCurrencyCode];
        require(outputErc20Contract != address(0), "Invalid output currency code.");
        require(orders.length > 0, "Orders array is empty.");
        require(orders.length == signatures.length, "Length of orders and signatures arrays must be equal.");
        require(takerAssetFillAmount > 0, "Taker asset fill amount must be greater than 0.");

        if (inputErc20Contract == address(0)) {
            // Wrap ETH and set input ERC20 contract to WETH if input currency is ETH
            _weth.deposit.value(inputAmount)();
            inputErc20Contract = WETH_CONTRACT;
        } else {
            // Transfer input tokens from msg.sender if not inputting ETH
            IERC20(inputErc20Contract).safeTransferFrom(msg.sender, address(this), inputAmount); // The user must approve the transfer of tokens beforehand
        }

        // Approve and exchange tokens
        ZeroExExchangeController.approve(inputErc20Contract, inputAmount);
        uint256[2] memory filledAmounts = ZeroExExchangeController.marketSellOrdersFillOrKill(orders, signatures, takerAssetFillAmount);

        // Refund unused input tokens and update input amount
        IERC20 inputToken = IERC20(inputErc20Contract);
        uint256 inputTokenBalance = inputToken.balanceOf(address(this));
        if (inputTokenBalance > 0) inputToken.safeTransfer(msg.sender, inputTokenBalance);

        // Emit event
        emit PreDepositExchange(inputErc20Contract, outputCurrencyCode, msg.sender, filledAmounts[0], filledAmounts[1]);

        // Deposit output tokens
        require(RariFundManager(_rariFundManagerContract).depositTo(msg.sender, outputCurrencyCode, filledAmounts[1]));

        // Refund unused ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) msg.sender.transfer(ethBalance);

        // Return true
        return true;
    }
    
    /**
     * @notice Exchanges and deposits funds to RariFund in exchange for RFT.
     * Please note that you must approve RariFundManager to burn of the necessary amount of RFT.
     * You also must input at least enough ETH to cover the protocol fee.
     * @dev We should be able to make this function external and use calldata for all parameters, but Solidity does not support calldata structs (https://github.com/ethereum/solidity/issues/5479).
     * @param inputCurrencyCodes The currency codes of the tokens to be withdrawn and exchanged.
     * @param inputAmounts The amounts of tokens to be withdrawn and exchanged (including taker fees).
     * @param outputErc20Contract The ERC20 contract address of the token to be outputted by the exchange. Set to address(0) to output ETH.
     * @param orders The limit orders to be filled in ascending order of price.
     * @param signatures The signatures for the orders.
     * @param makerAssetFillAmounts The amounts of the maker assets to buy.
     * @return Boolean indicating success.
     */
    function withdrawAndExchange(string[] memory inputCurrencyCodes, uint256[] memory inputAmounts, address outputErc20Contract, LibOrder.Order[][] memory orders, bytes[][] memory signatures, uint256[] memory makerAssetFillAmounts) public payable returns (bool) {
        // Input validation
        require(_rariFundManagerContract != address(0), "RariFundManager contract not set.");
        require(inputCurrencyCodes.length == inputAmounts.length && inputCurrencyCodes.length == orders.length && inputCurrencyCodes.length == signatures.length && inputCurrencyCodes.length == makerAssetFillAmounts.length, "Array parameters are not all the same length.");

        // For each input currency
        for (uint256 i = 0; i < inputCurrencyCodes.length; i++) {
            require(inputAmounts[i] > 0, "All input amounts must be greater than 0.");

            // Withdraw input tokens
            require(RariFundManager(_rariFundManagerContract).withdrawFrom(msg.sender, inputCurrencyCodes[i], inputAmounts[i]));

            if (orders[i].length > 0 && signatures[i].length > 0 && makerAssetFillAmounts[i] > 0) {
                // Input validation
                require(orders.length == signatures.length, "Length of all orders and signatures arrays must be equal.");
        
                // Exchange tokens and emit event
                uint256[2] memory filledAmounts = ZeroExExchangeController.marketBuyOrdersFillOrKill(orders[i], signatures[i], makerAssetFillAmounts[i]);
                emit PostWithdrawalExchange(inputCurrencyCodes[i], outputErc20Contract, msg.sender, inputAmounts[i], filledAmounts[1]);
            }
        }

        if (outputErc20Contract == address(0)) {
            // Unwrap WETH if output currency is ETH
            uint256 wethBalance = _weth.balanceOf(address(this));
            _weth.withdraw(wethBalance);
        } else {
            // Forward tokens if output currency is a token
            IERC20 outputToken = IERC20(outputErc20Contract);
            uint256 outputTokenBalance = outputToken.balanceOf(address(this));
            if (outputTokenBalance > 0) outputToken.safeTransfer(msg.sender, outputTokenBalance);
        }

        // Forward all ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) msg.sender.transfer(ethBalance);

        // Return true
        return true;
    }
}

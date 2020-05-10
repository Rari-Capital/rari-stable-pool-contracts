pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./lib/FarmerFundController.sol";
import "./FarmerFundToken.sol";

/**
 * @title FarmerFundManager
 * @dev This contract is the primary contract powering FarmerFund.
 * Anyone can deposit to the fund with deposit(string currencyCode, uint256 amount)
 * Anyone can withdraw their funds (with interest) from the fund with withdraw(string currencyCode, uint256 amount)
 */
contract FarmerFundManager is Ownable {
    using SafeMath for uint256;

    /**
     * @dev Boolean that, if true, disables deposits to and withdrawals from this FarmerFundManager.
     */
    bool private _fundDisabled;

    /**
     * @dev Address of the FarmerFundToken.
     */
    address private _farmerFundTokenContract;

    /**
     * @dev Maps ERC20 token contract addresses to their currency codes.
     */
    mapping(string => address) private _erc20Contracts;

    /**
     * @dev Maps arrays of supported pools to currency codes.
     */
    mapping(string => uint8[]) private _poolsByCurrency;

    /**
     * @dev Struct for a pending withdrawal.
     */
    struct PendingWithdrawal {
        address payee;
        uint256 amount;
    }

    /**
     * @dev Mapping of withdrawal queues to currency codes.
     */
    mapping(string => PendingWithdrawal[]) private _withdrawalQueues;

    /**
     * @dev Constructor that sets supported ERC20 token contract addresses and supported pools for each supported token.
     */
    constructor () public {
        _erc20Contracts["DAI"] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        _poolsByCurrency["DAI"].push(0);
        _poolsByCurrency["DAI"].push(1);
    }

    /**
     * @dev Fallback function to receive ETH to be used for gas fees.
     */
    function() external payable { }

    /**
     * @dev Emitted when FarmerFundManager is upgraded.
     */
    event FundManagerUpgraded(address newContract);

    /**
     * @dev Emitted when the FarmerFundToken of the FarmerFundManager is set.
     */
    event FundTokenSet(address newContract);

    /**
     * @dev Upgrades FarmerFundManager.
     * @param newContract The address of the new FarmerFundManager contract.
     */
    function upgradeFundManager(address newContract) external onlyOwner {
        require(_farmerFundTokenContract != address(0), "FarmerFundToken contract not set.");

        // Update FarmerFundToken minter
        FarmerFundToken farmerFundToken = FarmerFundToken(_farmerFundTokenContract);
        farmerFundToken.addMinter(newContract);
        farmerFundToken.renounceMinter();

        // Withdraw all from all pools
        for (uint256 i = 0; i < _poolsByCurrency["DAI"].length; i++)
            if (FarmerFundController.getPoolBalance(_poolsByCurrency["DAI"][i], _erc20Contracts["DAI"]) > 0)
                FarmerFundController.withdrawAllFromPool(_poolsByCurrency["DAI"][i], _erc20Contracts["DAI"]);

        // Transfer all tokens
        ERC20 token = ERC20(_erc20Contracts["DAI"]);
        token.transfer(newContract, token.balanceOf(address(this)));

        emit FundManagerUpgraded(newContract);
    }

    /**
     * @dev Sets or upgrades the FarmerFundToken of the FarmerFundManager.
     * @param newContract The address of the new FarmerFundToken contract.
     */
    function setFundToken(address newContract) external onlyOwner {
        _farmerFundTokenContract = newContract;
        emit FundTokenSet(newContract);
    }

    /**
     * @dev Emitted when deposits to and withdrawals from this FarmerFundManager have been disabled.
     */
    event FundDisabled();

    /**
     * @dev Emitted when deposits to and withdrawals from this FarmerFundManager have been enabled.
     */
    event FundEnabled();

    /**
     * @dev Disables deposits to and withdrawals from this FarmerFundManager while contract(s) are upgraded.
     */
    function disableFund() external onlyOwner {
        require(!_fundDisabled);
        _fundDisabled = true;
        emit FundDisabled();
    }

    /**
     * @dev Enables deposits to and withdrawals from this FarmerFundManager once contract(s) are upgraded.
     */
    function enableFund() external onlyOwner {
        require(_fundDisabled);
        _fundDisabled = false;
        emit FundEnabled();
    }

    /**
     * @dev Calculates an account's total balance of the specified currency.
     */
    function balanceOf(string calldata currencyCode, address account) external returns (uint256) {
        require(_farmerFundTokenContract != address(0), "FarmerFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        FarmerFundToken farmerFundToken = FarmerFundToken(_farmerFundTokenContract);
        uint256 fftTotalSupply = farmerFundToken.totalSupply();
        if (fftTotalSupply == 0) return 0;
        uint256 fftBalance = farmerFundToken.balanceOf(account);
        uint256 totalBalance = this.getTotalBalance(currencyCode);
        uint256 tokenBalance = fftBalance.mul(totalBalance).div(fftTotalSupply);

        return tokenBalance;
    }

    /**
     * @dev Calculates the fund's total balance of the specified currency.
     */
    function getTotalBalance(string memory currencyCode) public returns (uint256) {
        require(_poolsByCurrency[currencyCode].length > 0, "Invalid currency code.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20 token = ERC20(erc20Contract);
        uint256 totalBalance = token.balanceOf(address(this));
        for (uint256 i = 0; i < _poolsByCurrency[currencyCode].length; i++) totalBalance = totalBalance.add(FarmerFundController.getPoolBalance(_poolsByCurrency[currencyCode][i], erc20Contract));
        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) totalBalance = totalBalance.sub(_withdrawalQueues[currencyCode][i].amount);

        return totalBalance;
    }

    /**
     * @dev Emitted when funds have been deposited to FarmerFund.
     */
    event Deposit(string indexed currencyCode, address indexed sender, uint256 amount);

    /**
     * @dev Emitted when funds have been withdrawn from FarmerFund.
     */
    event Withdrawal(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @dev Emitted when funds have been queued for withdrawal from FarmerFund.
     */
    event WithdrawalQueued(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @dev Deposits funds to FarmerFund in exchange for FFT.
     * @param currencyCode The current code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     */
    function deposit(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(_farmerFundTokenContract != address(0), "FarmerFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20Detailed token = ERC20Detailed(erc20Contract);
        FarmerFundToken farmerFundToken = FarmerFundToken(_farmerFundTokenContract);
        uint256 fftTotalSupply = farmerFundToken.totalSupply();
        uint256 fftAmount = 0;

        if (fftTotalSupply > 0) {
            fftAmount = amount.mul(fftTotalSupply).div(this.getTotalBalance(currencyCode));
        } else {
            uint256 fftDecimals = farmerFundToken.decimals();
            uint256 tokenDecimals = token.decimals();
            fftAmount = fftDecimals >= tokenDecimals ? amount.mul(10 ** (fftDecimals - tokenDecimals)) : amount.div(10 ** (tokenDecimals - fftDecimals));
        }

        // The user must approve the transfer of tokens before calling this function
        require(token.transferFrom(msg.sender, address(this), amount), "Failed to transfer input tokens.");

        require(farmerFundToken.mint(msg.sender, fftAmount), "Failed to mint output tokens.");

        emit Deposit(currencyCode, msg.sender, amount);
        return true;
    }

    /**
     * @dev Withdraws funds from FarmerFund in exchange for FFT.
     * @param currencyCode The current code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function withdraw(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(_farmerFundTokenContract != address(0), "FarmerFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20 token = ERC20(erc20Contract);
        uint256 contractBalance = token.balanceOf(address(this));

        FarmerFundToken farmerFundToken = FarmerFundToken(_farmerFundTokenContract);
        uint256 fftTotalSupply = farmerFundToken.totalSupply();
        uint256 totalBalance = this.getTotalBalance(currencyCode);
        uint256 fftAmount = amount.mul(fftTotalSupply).div(totalBalance);
        require(fftAmount <= farmerFundToken.balanceOf(msg.sender), "Your FFT balance is too low for a withdrawal of this amount.");
        require(amount <= totalBalance, "Fund DAI balance is too low for a withdrawal of this amount.");

        // TODO: The user must approve the burning of tokens before calling this function
        farmerFundToken.burnFrom(msg.sender, fftAmount);

        if (amount <= contractBalance) {
            require(token.transfer(msg.sender, amount), "Failed to transfer output tokens.");
            emit Withdrawal(currencyCode, msg.sender, amount);
        } else  {
            _withdrawalQueues[currencyCode].push(PendingWithdrawal(msg.sender, amount));
            emit WithdrawalQueued(currencyCode, msg.sender, amount);
        }

        return true;
    }

    /**
     * @dev Processes pending withdrawals in the queue for the specified currency.
     * @param currencyCode The currency code of the token for which to process pending withdrawals.
     */
    function processPendingWithdrawals(string calldata currencyCode) external onlyOwner returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        ERC20 token = ERC20(erc20Contract);
        uint256 balanceHere = token.balanceOf(address(this));
        uint256 total = 0;
        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) total = total.add(_withdrawalQueues[currencyCode][i].amount);
        if (total > balanceHere) revert("Not enough balance to process pending withdrawals.");

        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) {
            require(token.transfer(_withdrawalQueues[currencyCode][i].payee, _withdrawalQueues[currencyCode][i].amount));
            emit Withdrawal(currencyCode, _withdrawalQueues[currencyCode][i].payee, _withdrawalQueues[currencyCode][i].amount);
        }

        _withdrawalQueues[currencyCode].length = 0;
        return true;
    }

    /**
     * @dev Counts the number of pending withdrawals in the queue for the specified currency.
     */
    function countPendingWithdrawals(string calldata currencyCode) external view returns (uint256) {
        return _withdrawalQueues[currencyCode].length;
    }

    /**
     * @dev Returns the payee of a pending withdrawal for the specified currency.
     */
    function getPendingWithdrawalPayee(string calldata currencyCode, uint256 index) external view returns (address) {
        return _withdrawalQueues[currencyCode][index].payee;
    }

    /**
     * @dev Returns the amount of a pending withdrawal for the specified currency.
     */
    function getPendingWithdrawalAmount(string calldata currencyCode, uint256 index) external view returns (uint256) {
        return _withdrawalQueues[currencyCode][index].amount;
    }

    /**
     * @dev Deposits funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     */
    function depositToPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyOwner returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(FarmerFundController.depositToPool(pool, erc20Contract, amount), "Pool deposit failed.");
        return true;
    }

    /**
     * @dev Withdraws funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyOwner returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(FarmerFundController.withdrawFromPool(pool, erc20Contract, amount), "Pool withdrawal failed.");
        return true;
    }

    /**
     * @dev Withdraws all funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The ERC20 contract of the token to be withdrawn.
     */
    function withdrawAllFromPool(uint8 pool, string calldata currencyCode) external onlyOwner returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(FarmerFundController.withdrawAllFromPool(pool, erc20Contract), "Pool withdrawal failed.");
        return true;
    }
}

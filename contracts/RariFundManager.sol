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
 * This file includes the Ethereum contract code for RariFundManager, the primary contract powering Rari Capital's RariFund.
 */

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./lib/RariFundController.sol";
import "./RariFundToken.sol";

/**
 * @title RariFundManager
 * @dev This contract is the primary contract powering RariFund.
 * Anyone can deposit to the fund with deposit(string currencyCode, uint256 amount)
 * Anyone can withdraw their funds (with interest) from the fund with withdraw(string currencyCode, uint256 amount)
 */
contract RariFundManager is Ownable {
    using SafeMath for uint256;

    /**
     * @dev Boolean that, if true, disables deposits to and withdrawals from this RariFundManager.
     */
    bool private _fundDisabled;

    /**
     * @dev Address of the RariFundToken.
     */
    address private _rariFundTokenContract;

    /**
     * @dev Address of the rebalancer.
     */
    address private _rariFundRebalancerAddress;

    /**
     * @dev Maps ERC20 token contract addresses to their currency codes.
     */
    string[] private _supportedCurrencies;

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
        // Add supported currency codes to array
        _supportedCurrencies.push("DAI");

        // Map ERC20 token contract addresses and supported pools to DAI
        _erc20Contracts["DAI"] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        _poolsByCurrency["DAI"].push(0); // dYdX
        _poolsByCurrency["DAI"].push(1); // Compound
    }

    /**
     * @dev Fallback function to receive ETH to be used for gas fees.
     */
    function() external payable { }

    /**
     * @dev Emitted when RariFundManager is upgraded.
     */
    event FundManagerUpgraded(address newContract);

    /**
     * @dev Emitted when the RariFundToken of the RariFundManager is set.
     */
    event FundTokenSet(address newContract);

    /**
     * @dev Emitted when the rebalancer of the RariFundManager is set.
     */
    event FundRebalancerSet(address newAddress);

    /**
     * @dev Upgrades RariFundManager.
     * @param newContract The address of the new RariFundManager contract.
     */
    function upgradeFundManager(address newContract) external onlyOwner {
        // Update RariFundToken minter
        if (_rariFundTokenContract != address(0)) {
            RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
            rariFundToken.addMinter(newContract);
            rariFundToken.renounceMinter();
        }

        // Withdraw all tokens from all pools and transfers them to new FundManager
        for (uint256 i = 0; i < _supportedCurrencies.length; i++) {
            string currencyCode = _supportedCurrencies[i];

            for (uint256 j = 0; j < _poolsByCurrency[currencyCode].length; j++)
                if (RariFundController.getPoolBalance(_poolsByCurrency[currencyCode][j], _erc20Contracts[currencyCode]) > 0)
                    RariFundController.withdrawAllFromPool(_poolsByCurrency[currencyCode][j], _erc20Contracts[currencyCode]);

            ERC20 token = ERC20(_erc20Contracts[currencyCode]);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) require(token.transfer(newContract, balance), "Failed to transfer tokens to new FundManager.");
        }

        // Forward ETH to new FundManager
        newContract.transfer(address(this).balance);

        emit FundManagerUpgraded(newContract);
    }

    /**
     * @dev Sets or upgrades the RariFundToken of the RariFundManager.
     * @param newContract The address of the new RariFundToken contract.
     */
    function setFundToken(address newContract) external onlyOwner {
        _rariFundTokenContract = newContract;
        emit FundTokenSet(newContract);
    }

    /**
     * @dev Sets or upgrades the rebalancer of the RariFundManager.
     * @param newAddress The Ethereum address of the new rebalancer server.
     */
    function setFundRebalancer(address newAddress) external onlyOwner {
        _rariFundRebalancerAddress = newAddress;
        emit FundRebalancerSet(newAddress);
    }

    /**
     * @dev Throws if called by any account other than the rebalancer.
     */
    modifier onlyRebalancer() {
        require(_rariFundRebalancerAddress == msg.sender, "Caller is not the rebalancer.");
        _;
    }

    /**
     * @dev Emitted when deposits to and withdrawals from this RariFundManager have been disabled.
     */
    event FundDisabled();

    /**
     * @dev Emitted when deposits to and withdrawals from this RariFundManager have been enabled.
     */
    event FundEnabled();

    /**
     * @dev Disables deposits to and withdrawals from this RariFundManager while contract(s) are upgraded.
     */
    function disableFund() external onlyOwner {
        require(!_fundDisabled, "Fund already disabled.");
        _fundDisabled = true;
        emit FundDisabled();
    }

    /**
     * @dev Enables deposits to and withdrawals from this RariFundManager once contract(s) are upgraded.
     */
    function enableFund() external onlyOwner {
        require(_fundDisabled, "Fund already enabled.");
        _fundDisabled = false;
        emit FundEnabled();
    }

    /**
     * @dev Calculates an account's total balance of the specified currency.
     */
    function balanceOf(string calldata currencyCode, address account) external returns (uint256) {
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        if (rftTotalSupply == 0) return 0;
        uint256 rftBalance = rariFundToken.balanceOf(account);
        uint256 totalBalance = this.getTotalBalance(currencyCode);
        uint256 tokenBalance = rftBalance.mul(totalBalance).div(rftTotalSupply);

        return tokenBalance;
    }

    /**
     * @dev Calculates the fund's raw total balance (investor funds + unclaimed fees) of the specified currency.
     */
    function getRawTotalBalance(string memory currencyCode) public returns (uint256) {
        require(_poolsByCurrency[currencyCode].length > 0, "Invalid currency code.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20 token = ERC20(erc20Contract);
        uint256 totalBalance = token.balanceOf(address(this));
        for (uint256 i = 0; i < _poolsByCurrency[currencyCode].length; i++) totalBalance = totalBalance.add(RariFundController.getPoolBalance(_poolsByCurrency[currencyCode][i], erc20Contract));
        for (uint256 i = 0; i < _withdrawalQueues[currencyCode].length; i++) totalBalance = totalBalance.sub(_withdrawalQueues[currencyCode][i].amount);

        return totalBalance;
    }

    /**
     * @dev Emitted when funds have been deposited to RariFund.
     */
    event Deposit(string indexed currencyCode, address indexed sender, uint256 amount);

    /**
     * @dev Emitted when funds have been withdrawn from RariFund.
     */
    event Withdrawal(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @dev Emitted when funds have been queued for withdrawal from RariFund.
     */
    event WithdrawalQueued(string indexed currencyCode, address indexed payee, uint256 amount);

    /**
     * @dev Deposits funds to RariFund in exchange for RFT.
     * @param currencyCode The current code of the token to be deposited.
     * @param amount The amount of tokens to be deposited.
     */
    function deposit(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20Detailed token = ERC20Detailed(erc20Contract);
        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        uint256 rftAmount = 0;

        if (rftTotalSupply > 0) {
            rftAmount = amount.mul(rftTotalSupply).div(this.getTotalBalance(currencyCode));
        } else {
            uint256 rftDecimals = rariFundToken.decimals();
            uint256 tokenDecimals = token.decimals();
            rftAmount = rftDecimals >= tokenDecimals ? amount.mul(10 ** (rftDecimals.sub(tokenDecimals))) : amount.div(10 ** (tokenDecimals.sub(rftDecimals)));
        }

        // TODO: Make sure the user must approve the transfer of tokens before calling the deposit function
        require(token.transferFrom(msg.sender, address(this), amount), "Failed to transfer input tokens.");
        _netDeposits = _netDeposits.add(amount); // TODO: Support multiple currencies with _netDeposits
        require(rariFundToken.mint(msg.sender, rftAmount), "Failed to mint output tokens.");
        emit Deposit(currencyCode, msg.sender, amount);
        return true;
    }

    /**
     * @dev Withdraws funds from RariFund in exchange for RFT.
     * @param currencyCode The current code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function withdraw(string calldata currencyCode, uint256 amount) external returns (bool) {
        require(_rariFundTokenContract != address(0), "RariFundToken contract not set.");
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");

        ERC20 token = ERC20(erc20Contract);
        uint256 contractBalance = token.balanceOf(address(this));

        RariFundToken rariFundToken = RariFundToken(_rariFundTokenContract);
        uint256 rftTotalSupply = rariFundToken.totalSupply();
        uint256 totalBalance = this.getTotalBalance(currencyCode);
        uint256 rftAmount = amount.mul(rftTotalSupply).div(totalBalance);
        require(rftAmount <= rariFundToken.balanceOf(msg.sender), "Your RFT balance is too low for a withdrawal of this amount.");
        require(amount <= totalBalance, "Fund DAI balance is too low for a withdrawal of this amount.");

        // TODO: Make sure the user must approve the burning of tokens before calling the withdraw function
        rariFundToken.burnFrom(msg.sender, rftAmount);
        _netDeposits = _netDeposits.sub(amount); // TODO: Support multiple currencies with _netDeposits

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
    function processPendingWithdrawals(string calldata currencyCode) external returns (bool) {
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
    function depositToPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.depositToPool(pool, erc20Contract, amount), "Pool deposit failed.");
        return true;
    }

    /**
     * @dev Withdraws funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The currency code of the token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     */
    function withdrawFromPool(uint8 pool, string calldata currencyCode, uint256 amount) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.withdrawFromPool(pool, erc20Contract, amount), "Pool withdrawal failed.");
        return true;
    }

    /**
     * @dev Withdraws all funds from any supported pool.
     * @param pool The name of the pool.
     * @param currencyCode The ERC20 contract of the token to be withdrawn.
     */
    function withdrawAllFromPool(uint8 pool, string calldata currencyCode) external onlyRebalancer returns (bool) {
        address erc20Contract = _erc20Contracts[currencyCode];
        require(erc20Contract != address(0), "Invalid currency code.");
        require(RariFundController.withdrawAllFromPool(pool, erc20Contract), "Pool withdrawal failed.");
        return true;
    }
    
    /**
     * @dev Fund's public balance: combined balance of all users of the fund (does not include unclaimed interest fees; on the other hand, getTotalBalanceRaw() does)
     */
    function getTotalBalance() public view returns (uint256) {
        return getRawTotalBalance().sub(getInterestFeesUnclaimed());
    }

    /**
     * @dev The net quantity of deposits (i.e., deposits - withdrawals).
     * On deposit, amount deposited is added to _netDeposits; on withdrawal, amount withdrawn is subtracted from _netDeposits.
     */
    uint256 private _netDeposits;
    
    /**
     * @dev The total amount of interest accrued (including the fees paid on interest).
     */
    function getRawInterestAccrued() internal view returns (uint256) {
        return getRawTotalBalance() - _netDeposits + _interestFeesClaimed
    }
    
    /**
     * @dev The amount of interest accrued by investors (excluding the fees taken on interest).
     */
    function getInterestAccrued() public view returns (uint256) {
        return getTotalBalance() - _netDeposits
    }

    /**
     * @dev The proportion of interest accrued that is taken as a service fee (scaled by 1e18).
     */
    uint256 private _interestFeeRate;

    /**
     * @dev Claims all fees, updates _interestAccruedAtLastFeeRateChange and _interestFeesGeneratedAtLastFeeRateChange, then sets the interest fee rate.
     * @param beneficiary The master beneficiary of fees on interest; i.e., the recipient of all unshared fees on interest.
     */
    function setInterestFeeRate(address rate) external onlyOwner {
        require(rate != _interestFeeRate, "This is already the current interest fee rate.");
        for (var i = 0; i < _interestFeeShareBeneficiaries.length; i++) claimFees(_interestFeeShareBeneficiaries);
        _interestFeesGeneratedAtLastFeeRateChange = getInterestFeesGenerated(); // MUST update this first before updating _rawInterestAccruedAtLastFeeRateChange since it depends on it 
        _rawInterestAccruedAtLastFeeRateChange = getRawInterestAccrued();
        _interestFeeRate = rate;
    }

    /**
     * @dev The amount of interest fees accrued by beneficiaries.
     */
    function getInterestFeeRate() public view returns (uint256) {
        return _interestFeeRate;
    }

    /**
     * @dev The amount of interest accrued at the time of the most recent change to the fee rate.
     */
    uint256 private _interestAccruedAtLastFeeRateChange = 0;

    /**
     * @dev The amount of fees generated on interest at the time of the most recent change to the fee rate.
     */
    uint256 private _interestFeesGeneratedAtLastFeeRateChange = 0;

    /**
     * @dev The amount of interest fees accrued by beneficiaries.
     */
    function getInterestFeesGenerated() public view returns (uint256) {
        return _interestFeesGeneratedAtLastFeeRateChange.add(getRawInterestAccrued().sub(_rawInterestAccruedAtLastFeeRateChange).mul(_interestFeeRate).div(1e18));
    }

    /**
     * @dev The total claimed amount of interest fees (shared + unshared).
     */
    uint256 private _interestFeesClaimed;

    /**
     * @dev Returns the total unclaimed amount of interest fees (shared + unshared).
     */
    function getInterestFeesUnclaimed() internal view returns (uint256) {
        return getInterestFeesGenerated() - _interestFeesClaimed;
    }

    /**
     * @dev Struct for an active share of interest fees.
     */
    struct InterestFeeShare { 
        uint256 shareProportion; // Proportion of interest fees shared/awarded to a beneficiary (scaled by 1e18); value of interest fees awarded = shareProportion * (getInterestFeesGenerated() - feesGeneratedWhenShareLastChanged)
        uint256 feesClaimedSinceShareLastChanged; // Claimed amount of fees on interest since share was created
        uint256 feesGeneratedWhenShareLastChanged; // getInterestFeesGenerated() at the time of creation of each share
    }

    /**
     * @dev Array of beneficiaries with active shares of interest fees.
     */
    address[] private _interestFeeShareBeneficiaries;

    /**
     * @dev Mapping of active shares of interest fees to beneficiaries.
     */
    mapping(address => InterestFeeShare) private _interestFeeShares;

    /**
     * @dev Emitted when an interest fee share is updated.
     */
    event InterestFeeShareUpdated(address beneficiary, uint256 shareProportion);

    /**
     * @dev Updates _interestFeeShareBeneficiaries and _interestFeesShares, running claimFees() and resetting feesClaimedSinceShareLastChanged and feesGeneratedWhenShareLastChanged when changing a share proportion.
     * @param beneficiary The recipient of the fees.
     * @param shareProportion The proportion of interest fees that will be shared/awarded to the beneficiary (scaled by 1e18).
     */
    function updateInterestFeeShare(address beneficiary, uint256 shareProportion) external onlyOwner {
        require(shareProportion >= 0, "Share proportion cannot be negative.")
        require(shareProportion != _interestFeeShares[beneficiary].shareProportion, "This share proportion is already set for this beneficary.");

        // If beneficiary has existing share proportion, claim their unclaimed fees and, if we are removing them, update the array; otherwise, add them to the array
        if (_interestFeeShares[beneficiary].shareProportion > 0) {
            claimFees(beneficiary);

            if (shareProportion == 0) {
                // Get index of beneficiary
                for (uint256 i = 0; i < _interestFeeShareBeneficiaries.length; i++) if (_interestFeeShareBeneficiaries[i] == beneficiary) {
                    // Remove beneficiary
                    for (uint256 j = i; j < _interestFeeShareBeneficiaries.length - 1; j++) _interestFeeShareBeneficiaries[j] = _interestFeeShareBeneficiaries[j + 1];
                    _interestFeeShareBeneficiaries.length--;
                }
            }
        } else _interestFeeShareBeneficiaries.push(beneficiary);

        // Set data in storage and emit event
        _interestFeeShares[beneficiary] = InterestFeeShare(shareProportion, 0, getInterestFeesGenerated());
        emit InterestFeeShareUpdated(beneficiary, shareProportion);
    }

    /**
     * @dev Returns the total unclaimed amount of shared interest fees.
     */
    function getSharedInterestFeesUnclaimed() internal view returns (uint256) {
        uint256 sharedInterestFeesUnclaimed = 0;
        for (var i = 0; i < _interestFeeShareBeneficiaries.length; i++) sharedInterestFeesUnclaimed = sharedInterestFeesUnclaimed.add(getBeneficiarySharedInterestFeesUnclaimed(_interestFeeShareBeneficiaries[i]));
        return sharedInterestFeesUnclaimed;
    }

    /**
     * @dev Returns the unclaimed amount of shared interest fees belonging to a given beneficiary.
     * @param beneficiary The recipient of the fees.
     */
    function getBeneficiarySharedInterestFeesUnclaimed(address beneficiary) internal view returns (uint256) {
        if (_interestFeeShares[beneficiary].shareProportion == 0) return 0;
        uint256 feesAwarded = getInterestFeesGenerated() - _interestFeeShares[beneficiary].feesGeneratedWhenShareLastChanged) * _interestFeesShares[beneficiary] / 1e18;
        return feesAwarded - _interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged;
    }

    /**
     * @dev The master beneficiary of fees on interest; i.e., the recipient of all unshared fees on interest.
     */
    address private _interestFeeMasterBeneficiary;

    /**
     * @dev Sets the master beneficiary of interest fees.
     * @param beneficiary The master beneficiary of fees on interest; i.e., the recipient of all unshared fees on interest.
     */
    function setInterestFeeMasterBeneficiary(address beneficiary) external onlyOwner {
        require(beneficiary != address(0), "Interest fee master beneficiary cannot be the zero address.");
        _interestFeeMasterBeneficiary = beneficiary;
    }

    /**
     * @dev Returns the unclaimed amount of unshared interest fees (i.e., those belonging to the master beneficiary).
     */
    function getMasterBeneficiaryInterestFeesUnclaimed() internal view returns (uint256) {
        return getInterestFeesUnclaimed().sub(getSharedInterestFeesUnclaimed());
    }

    /**
     * @dev Emitted when fees on interest are withdrawn.
     */
    event InterestFeesClaimed(address beneficiary, uint256 amount);

    /**
     * @dev Withdraws all accrued fees on interest to a valid beneficiary.
     * @param beneficiary The recipient of the fees.
     */
    function claimFees(address beneficiary) external returns (bool) {
        require(beneficiary != address(0), "Beneficiary cannot be the zero address.");
        uint256 sharedFeesToClaim = getBeneficiarySharedInterestFeesUnclaimed(beneficiary);
        uint256 masterBeneficiaryInterestFeesUnclaimed = beneficiary == _interestFeeMasterBeneficiary ? getMasterBeneficiaryInterestFeesUnclaimed() : 0;
        uint256 feesToClaim = sharedFeesToClaim.add(masterBeneficiaryInterestFeesUnclaimed);
        require(feesToClaim > 0, "No new fees are available for this beneficiary to claim.");
        _interestFeesClaimed = _interestFeesClaimed.add(feesToClaim);
        if (_interestFeeShares[beneficiary].shareProportion > 0) _interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged = _interestFeeShares[beneficiary].feesClaimedSinceShareLastChanged.add(sharedFeesToClaim);        
        require(ERC20(_erc20Contracts["DAI"]).transfer(beneficiary, feesToClaim));
        emit InterestFeesClaimed(beneficiary, feesToClaim);
        return true;
    }
}

pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV3Interface.sol";

import "./external/mstable/IBasketManager.sol";
import "./external/mstable/MassetStructs.sol";

contract RariFundPriceConsumer is Initializable {
    using SafeMath for uint256;

    /**
     * @dev Chainlink price feed for DAI/USD.
     */
    AggregatorV3Interface private _daiUsdPriceFeed;
    
    /**
     * @dev Chainlink price feed for ETH/USD.
     */
    AggregatorV3Interface private _ethUsdPriceFeed;

    /**
     * @dev Chainlink price feeds for ETH-based pairs.
     */
    mapping(string => AggregatorV3Interface) private _ethBasedPriceFeeds;

    /**
     * @dev mStable mUSD basket manager contract.
     */
    IBasketManager constant private _basketManager = IBasketManager(0x66126B4aA2a1C07536Ef8E5e8bD4EfDA1FdEA96D);

    /**
     * @dev mStable mUSD token contract.
     */
    IERC20 constant private _mUsd = IERC20(0xe2f2a5C287993345a840Db3B0845fbC70f5935a5);

    /**
     * @dev Initializer that sets supported ERC20 contract addresses and price feeds for each supported token.
     */
    function initialize() public initializer {
        _daiUsdPriceFeed = AggregatorV3Interface(0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9);
        _ethUsdPriceFeed = AggregatorV3Interface(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419);
        _ethBasedPriceFeeds["USDC"] = AggregatorV3Interface(0x986b5E1e1755e3C2440e960477f25201B0a8bbD4);
        _ethBasedPriceFeeds["USDT"] = AggregatorV3Interface(0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46);
        _ethBasedPriceFeeds["TUSD"] = AggregatorV3Interface(0x3886BA987236181D98F2401c507Fb8BeA7871dF2);
        _ethBasedPriceFeeds["BUSD"] = AggregatorV3Interface(0x614715d2Af89E6EC99A233818275142cE88d1Cfd);
        _ethBasedPriceFeeds["sUSD"] = AggregatorV3Interface(0x8e0b7e6062272B5eF4524250bFFF8e5Bd3497757);
    }

    /**
     * @dev Retrives the latest DAI/USD price.
     */
    function getDaiUsdPrice() internal view returns (uint256) {
        (, int256 price, , , ) = _daiUsdPriceFeed.latestRoundData();
        return price >= 0 ? uint256(price).mul(1e10) : 0;
    }

    /**
     * @dev Retrives the latest ETH/USD price.
     */
    function getEthUsdPrice() internal view returns (uint256) {
        (, int256 price, , , ) = _ethUsdPriceFeed.latestRoundData();
        return price >= 0 ? uint256(price).mul(1e10) : 0;
    }

    /**
     * @dev Retrives the latest price of an ETH-based pair.
     */
    function getPriceInEth(string memory currencyCode) internal view returns (uint256) {
        (, int256 price, , , ) = _ethBasedPriceFeeds[currencyCode].latestRoundData();
        return price >= 0 ? uint256(price) : 0;
    }

    /**
     * @dev Retrives the latest mUSD/USD price given the prices of the underlying bAssets.
     */
    function getMUsdUsdPrice(uint256[] memory bAssetUsdPrices) internal view returns (uint256) {
        (MassetStructs.Basset[] memory bAssets, ) = _basketManager.getBassets();
        uint256 usdSupplyScaled = 0;
        for (uint256 i = 0; i < bAssets.length; i++) usdSupplyScaled = usdSupplyScaled.add(bAssets[i].vaultBalance.mul(bAssets[i].ratio).div(1e8).mul(bAssetUsdPrices[i]));
        return usdSupplyScaled.div(_mUsd.totalSupply());
    }

    /**
     * @notice Returns the price of each supported currency in USD.
     */
    function getCurrencyPricesInUsd() external view returns (uint256[] memory) {
        // Get bAsset prices and mUSD price
        uint256 ethUsdPrice = getEthUsdPrice();
        uint256[] memory prices = new uint256[](7);
        prices[0] = getDaiUsdPrice();
        prices[1] = getPriceInEth("USDC").mul(ethUsdPrice).div(1e18);
        prices[2] = getPriceInEth("TUSD").mul(ethUsdPrice).div(1e18);
        prices[3] = getPriceInEth("USDT").mul(ethUsdPrice).div(1e18);
        prices[6] = getMUsdUsdPrice(prices);

        // Reorder bAsset prices to match _supportedCurrencies
        uint256 tusdPrice = prices[2];
        prices[2] = prices[3];
        prices[3] = tusdPrice;

        // Get other prices
        prices[4] = getPriceInEth("BUSD").mul(ethUsdPrice).div(1e18);
        prices[5] = getPriceInEth("sUSD").mul(ethUsdPrice).div(1e18);

        // Return prices array
        return prices;
    }
}

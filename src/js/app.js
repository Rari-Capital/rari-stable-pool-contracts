// Unpackage imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.EvmChains;
const Fortmatic = window.Fortmatic;
const Torus = window.Torus;
const Portis = window.Portis;
const Authereum = window.Authereum;

// Enable Big.toFormat
toFormat(Big);

App = {
  web3: null,
  web3Gsn: null,
  web3Modal: null,
  web3Provider: null,
  accounts: [],
  selectedAccount: null,
  contracts: {},
  contractsGsn: {},
  tokens: {
    "DAI": { decimals: 18, address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    "USDC": { decimals: 6, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    "USDT": { decimals: 6, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    "TUSD": { decimals: 18, address: "0x0000000000085d4780B73119b644AE5ecd22b376" },
    "BUSD": { decimals: 18, address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53" },
    "sUSD": { decimals: 18, address: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51" },
    "mUSD": { decimals: 18, address: "0xe2f2a5C287993345a840Db3B0845fbC70f5935a5" }
  },
  erc20Abi: null,
  zeroExPrices: {},
  usdPrices: {},
  usdPricesLastUpdated: 0,
  checkAccountBalanceLimit: true,
  acceptedCurrencies: [],
  supportedCurrencies: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"],
  chainlinkPricesInUsd: {},

  init: function() {
    if (location.hash === "#account") {
      $('#page-fund').hide();
      $('#page-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    }

    $('#tab-fund').click(function() {
      $('#page-account').hide();
      $('#page-fund').show();
      $('#tab-account').css('text-decoration', '');
      $('#tab-fund').css('text-decoration', 'underline');
    });

    $('#tab-account').click(function() {
      $('#page-fund').hide();
      $('#page-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    });

    // Bypass account balance limit checking (client-side only)
    var zKeyDown = false;
    var mKeyDown = false;
    document.addEventListener('keydown', function (e) {
        if (e.keyCode == 90) zKeyDown = true;
        if (mKeyDown) App.checkAccountBalanceLimit = false;
    });
    document.addEventListener('keydown', function (e) {
        if (e.keyCode == 77) mKeyDown = true;
        if (zKeyDown) App.checkAccountBalanceLimit = false;
    });

    App.initChartColors();
    App.initWeb3();
    App.bindEvents();
  },

  initChartColors: function() {
    Chart.defaults.global.defaultFontColor = "#999";
    window.chartColors = {
      red: 'rgb(255, 99, 132)',
      orange: 'rgb(255, 159, 64)',
      yellow: 'rgb(255, 205, 86)',
      green: 'rgb(75, 192, 192)',
      blue: 'rgb(54, 162, 235)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(201, 203, 207)'
    };
  },

  getCurrentApy: async function() {
    var factors = [];
    var totalBalanceUsdBN = Web3.utils.toBN(0);
    var dydxApyBNs = await App.getDydxApyBNs();
    var compoundApyBNs = await App.getCompoundApyBNs();
    var aaveApyBNs = await App.getAaveApyBNs();
    var mstableApyBNs = await App.getMStableApyBNs();
    App.allocationsByPool = { 0: Web3.utils.toBN(0), 1: Web3.utils.toBN(0), 2: Web3.utils.toBN(0), 3: Web3.utils.toBN(0) };
    App.allocationsByCurrency = { "DAI": Web3.utils.toBN(0), "USDC": Web3.utils.toBN(0), "USDT": Web3.utils.toBN(0), "TUSD": Web3.utils.toBN(0), "BUSD": Web3.utils.toBN(0), "sUSD": Web3.utils.toBN(0), "mUSD": Web3.utils.toBN(0) };
    var allBalances = await App.contracts.RariFundProxy.methods.getRawFundBalancesAndPrices().call();

    for (var i = 0; i < allBalances["0"].length; i++) {
      var currencyCode = allBalances["0"][i];
      var priceInUsdBN = Web3.utils.toBN(allBalances["4"][i]);
      App.chainlinkPricesInUsd[currencyCode] = priceInUsdBN;
      var contractBalanceBN = Web3.utils.toBN(allBalances["1"][i]);
      var contractBalanceUsdBN = contractBalanceBN.mul(priceInUsdBN).div(Web3.utils.toBN(10 ** App.tokens[currencyCode].decimals)); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1
      factors.push([contractBalanceUsdBN, Web3.utils.toBN(0)]);
      totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN);
      App.allocationsByCurrency[currencyCode] = contractBalanceUsdBN;
      var pools = allBalances["2"][i];
      var poolBalances = allBalances["3"][i];

      for (var j = 0; j < pools.length; j++) {
        var pool = pools[j];
        var poolBalanceBN = Web3.utils.toBN(poolBalances[j]);
        var poolBalanceUsdBN = poolBalanceBN.mul(priceInUsdBN).div(Web3.utils.toBN(10 ** App.tokens[currencyCode].decimals)); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1
        var apyBN = pool == 3 ? mstableApyBNs[currencyCode] : (
          pool == 2 ? aaveApyBNs[currencyCode] : (
            pool == 1 ? compoundApyBNs[currencyCode][0].add(compoundApyBNs[currencyCode][1]) : dydxApyBNs[currencyCode]
          )
        );
        factors.push([poolBalanceUsdBN, apyBN]);
        totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN);
        App.allocationsByCurrency[currencyCode].iadd(poolBalanceUsdBN);
        App.allocationsByPool[pool].iadd(poolBalanceUsdBN);
      }
    }

    if (totalBalanceUsdBN.isZero()) {
      var maxApyBN = Web3.utils.toBN(0);
      for (var i = 0; i < factors.length; i++) if (factors[i][1].gt(maxApyBN)) maxApyBN = factors[i][1];
      return $('#APYNow').text((parseFloat(maxApyBN.toString()) / 1e16).toFixed(2) + "%");
    }

    var apyBN = Web3.utils.toBN(0);
    for (var i = 0; i < factors.length; i++) apyBN.iadd(factors[i][0].mul(factors[i][1]).div(totalBalanceUsdBN));
    $('#APYNow').text((parseFloat(apyBN.toString()) / 1e16).toFixed(2) + "%");

    App.initCurrencyAllocationChart();
    App.initPoolAllocationChart();
  },

  initCurrencyAllocationChart: function() {
    var ctx = document.getElementById('chart-currencies').getContext('2d');
    var color = Chart.helpers.color;

    var cfg = {
      type: 'pie',
      data: {
        datasets: [{
          data: [
            App.allocationsByCurrency["DAI"].toString() / 1e18,
            App.allocationsByCurrency["USDC"].toString() / 1e18,
            App.allocationsByCurrency["USDT"].toString() / 1e18,
            App.allocationsByCurrency["TUSD"].toString() / 1e18,
            App.allocationsByCurrency["BUSD"].toString() / 1e18,
            App.allocationsByCurrency["sUSD"].toString() / 1e18,
            App.allocationsByCurrency["mUSD"].toString() / 1e18
          ],
          backgroundColor: [
            color(window.chartColors.red).alpha(0.5).rgbString(),
            color(window.chartColors.orange).alpha(0.5).rgbString(),
            color(window.chartColors.yellow).alpha(0.5).rgbString(),
            color(window.chartColors.green).alpha(0.5).rgbString(),
            color(window.chartColors.blue).alpha(0.5).rgbString(),
            color(window.chartColors.purple).alpha(0.5).rgbString(),
            color(window.chartColors.grey).alpha(0.5).rgbString()
          ],
          borderColor: [
            window.chartColors.red,
            window.chartColors.orange,
            window.chartColors.yellow,
            window.chartColors.green,
            window.chartColors.blue,
            window.chartColors.purple,
            window.chartColors.gray
          ]
        }],
        labels: [
          'DAI',
          'USDC',
          'USDT',
          'TUSD',
          'BUSD',
          'sUSD',
          'mUSD'
        ]
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, myData) {
              var label = myData.labels[tooltipItem.index] || '';
              if (label) {
                label += ': ';
              }
              label += "$" + new Big(myData.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]).toFormat(2);
              return label;
            }
          }
        }
      }
    };

    var chart = new Chart(ctx, cfg);
  },

  initPoolAllocationChart: function() {
    var ctx = document.getElementById('chart-pools').getContext('2d');
    var color = Chart.helpers.color;

    var cfg = {
      type: 'pie',
      data: {
        datasets: [{
          data: [
            App.allocationsByPool[0].toString() / 1e18,
            App.allocationsByPool[1].toString() / 1e18,
            App.allocationsByPool[2].toString() / 1e18,
            App.allocationsByPool[3].toString() / 1e18
          ],
          backgroundColor: [
            color(window.chartColors.blue).alpha(0.5).rgbString(),
            color(window.chartColors.red).alpha(0.5).rgbString(),
            color(window.chartColors.yellow).alpha(0.5).rgbString(),
            color(window.chartColors.purple).alpha(0.5).rgbString()
          ],
          borderColor: [
            window.chartColors.blue,
            window.chartColors.red,
            window.chartColors.yellow,
            window.chartColors.purple
          ]
        }],
        labels: [
          'dYdX',
          'Compound',
          'Aave',
          'mStable'
        ]
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, myData) {
              var label = myData.labels[tooltipItem.index] || '';
              if (label) {
                label += ': ';
              }
              label += "$" + new Big(myData.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]).toFormat(2);
              return label;
            }
          }
        }
      }
    };

    var chart = new Chart(ctx, cfg);
  },

  getDydxApyBNs: async function() {
    const data = await $.getJSON("https://api.dydx.exchange/v1/markets");
    var apyBNs = {};

    for (var i = 0; i < data.markets.length; i++)
      if (["DAI", "USDC", "USDT"].indexOf(data.markets[i].symbol) >= 0)
        apyBNs[data.markets[i].symbol] = Web3.utils.toBN(Math.trunc(parseFloat(data.markets[i].totalSupplyAPR) * 1e18));

    return apyBNs;
  },

  getCompoundApyBNs: async function() {
    const data = await $.getJSON("https://api.compound.finance/api/v2/ctoken");
    var apyBNs = {};

    for (var i = 0; i < data.cToken.length; i++) {
      if (["DAI", "USDC", "USDT"].indexOf(data.cToken[i].underlying_symbol) >= 0) {
        var supplyApy = Web3.utils.toBN(Math.trunc(parseFloat(data.cToken[i].supply_rate.value) * 1e18));
        var compApy = Web3.utils.toBN(Math.trunc((await App.getApyFromComp(data.cToken[i].underlying_symbol, data.cToken)) * 1e18));
        apyBNs[data.cToken[i].underlying_symbol] = [supplyApy, compApy];
      }
    }

    return apyBNs;
  },

  getAaveApyBNs: async function() {
    const data = await $.ajax("https://api.thegraph.com/subgraphs/name/aave/protocol-multy-raw", { data: JSON.stringify({ query: `{
      reserves(where: {
        symbol_in: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "SUSD"]
      }) {
        symbol
        liquidityRate
      }
    }` }), contentType: 'application/json', type: 'POST' });

    var apyBNs = {};

    for (var i = 0; i < data.data.reserves.length; i++)
      apyBNs[data.data.reserves[i].symbol == "SUSD" ? "sUSD" : data.data.reserves[i].symbol] = Web3.utils.toBN(data.data.reserves[i].liquidityRate).div(Web3.utils.toBN(1e9));

    return apyBNs;
  },

  // Based on calculateApy at https://github.com/mstable/mStable-app/blob/v1.8.1/src/web3/hooks.ts#L84
  calculateMStableApyBN: function(startTimestamp, startExchangeRate, endTimestamp, endExchangeRate) {
    const SCALE = new Big(1e18);
    const YEAR_BN = new Big(365 * 24 * 60 * 60);
  
    const rateDiff = new Big(endExchangeRate).mul(SCALE).div(startExchangeRate).sub(SCALE);
    const timeDiff = new Big(endTimestamp - startTimestamp);
  
    const portionOfYear = timeDiff.mul(SCALE).div(YEAR_BN);
    const portionsInYear = SCALE.div(portionOfYear);
    const rateDecimals = SCALE.add(rateDiff).div(SCALE);

    if (rateDecimals.gt(0)) {
        const diff = rateDecimals.pow(parseFloat(portionsInYear.toString()));
        const parsed = diff.mul(SCALE);
        return Web3.utils.toBN(parsed.sub(SCALE).toFixed(0)) || Web3.utils.toBN(0);
    }

    return Web3.utils.toBN(0);
  },

  getMStableApyBN: async function() {
    // TODO: Get exchange rates from contracts instead of The Graph
    // TODO: Use instantaneous APY instead of 24-hour APY?
    // Calculate APY with calculateApy using exchange rates from The Graph
    var epochNow = Math.floor((new Date()).getTime() / 1000);
    var epoch24HrsAgo = epochNow - 86400;

    const data = await $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", { data: JSON.stringify({
      "operationName": "ExchangeRates",
      "variables": { "day0": epoch24HrsAgo, "day1": epochNow },
      "query": "query ExchangeRates($day0: Int!, $day1: Int!) {\n  day0: exchangeRates(where: {timestamp_lt: $day0}, orderDirection: desc, orderBy: timestamp, first: 1) {\n    ...ER\n    __typename\n  }\n  day1: exchangeRates(where: {timestamp_lt: $day1}, orderDirection: desc, orderBy: timestamp, first: 1) {\n    ...ER\n    __typename\n  }\n}\n\nfragment ER on ExchangeRate {\n  exchangeRate\n  timestamp\n  __typename\n}\n"
    }), contentType: 'application/json', type: 'POST' });

    if (!data || !data.data) return console.error("Failed to decode exchange rates from The Graph when calculating mStable 24-hour APY");
    return App.calculateMStableApyBN(epoch24HrsAgo, data.data.day0[0].exchangeRate, epochNow, data.data.day1[0].exchangeRate);
  },

  getMStableApyBNs: async function() {
    return { "mUSD": await App.getMStableApyBN() };
  },

  getCurrencyUsdRates: function(currencyCodes) {
    return new Promise((resolve, reject) => {
      $.getJSON('https://api.coingecko.com/api/v3/coins/list', function(decoded) {
        if (!decoded) return reject("Failed to decode coins list from CoinGecko");
        var currencyCodesByCoinGeckoIds = {};

        for (const currencyCode of currencyCodes) {
          if (currencyCode === "COMP") currencyCodesByCoinGeckoIds["compound-governance-token"] = "COMP";
          else if (currencyCode === "REP") currencyCodesByCoinGeckoIds["augur"] = "REP";
          else currencyCodesByCoinGeckoIds[decoded.find(coin => coin.symbol.toLowerCase() === currencyCode.toLowerCase()).id] = currencyCode;
        }

        $.getJSON('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' + Object.keys(currencyCodesByCoinGeckoIds).join('%2C'), function(decoded) {
          if (!decoded) return reject("Failed to decode USD exchange rates from CoinGecko");
          var prices = {};
          for (const key of Object.keys(decoded)) prices[currencyCodesByCoinGeckoIds[key]] = ["DAI", "USDC", "USDT", "SAI"].indexOf(currencyCodesByCoinGeckoIds[key]) >= 0 ? 1.0 : decoded[key].usd;
          resolve(prices);
        }).fail(function(err) {
          reject("Error requesting currency rates from CoinGecko: " + err.message);
        });
      }).fail(function(err) {
        reject("Error requesting currency rates from CoinGecko: " + err.message);
      });
    });
  },

  getApyFromComp: async function(currencyCode, cTokens) {
    // Get cToken USD prices
    var currencyCodes = ["COMP"];
    var priceMissing = false;

    for (const cToken of cTokens) {
      currencyCodes.push(cToken.underlying_symbol);
      if (!App.usdPrices[cToken.underlying_symbol]) priceMissing = true;
    }

    var now = (new Date()).getTime() / 1000;

    if (now > App.usdPricesLastUpdated + 900 || priceMissing) {
      App.usdPrices = await App.getCurrencyUsdRates(currencyCodes); // TODO: Get real USD prices, not DAI prices
      App.usdPricesLastUpdated = now;
    }
    
    // Get currency APY and total yearly interest
    var currencyUnderlyingSupply = 0;
    var currencyBorrowUsd = 0;
    var totalBorrowUsd = 0;
    
    for (const cToken of cTokens) {
      var underlyingBorrow = cToken.total_borrows.value * cToken.exchange_rate.value;
      var borrowUsd = underlyingBorrow * App.usdPrices[cToken.underlying_symbol];

      if (cToken.underlying_symbol === currencyCode) {
        currencyUnderlyingSupply = cToken.total_supply.value * cToken.exchange_rate.value;
        currencyBorrowUsd = borrowUsd;
      }

      totalBorrowUsd += borrowUsd;
    }
    
    // Get APY from COMP per block for this currency
    var compPerBlock = 0.5;
    var marketCompPerBlock = compPerBlock * (currencyBorrowUsd / totalBorrowUsd);
    var marketSupplierCompPerBlock = marketCompPerBlock / 2;
    var marketSupplierCompPerBlockPerUsd = marketSupplierCompPerBlock / currencyUnderlyingSupply; // Assumes that the value of currencyCode is $1
    var marketSupplierUsdFromCompPerBlockPerUsd = marketSupplierCompPerBlockPerUsd * App.usdPrices["COMP"];
    return marketSupplierUsdFromCompPerBlockPerUsd * 2102400;
  },

  initAprChart: function() {
    var epochToday = Math.floor((new Date()).getTime() / 1000 / 86400) * 86400;

    var mStableEpochs = [Math.floor((new Date()).getTime() / 1000)];
    for (var i = 1; i < 365; i++) mStableEpochs.push(mStableEpochs[0] - (86400 * i));
    var mStableSubgraphVariables = {};
    for (var i = 0; i < 365; i++) mStableSubgraphVariables["day" + i] = mStableEpochs[364 - i];
    var mStableSubgraphArgs = [];
    var mStableSubgraphReturns = "";

    for (var i = 0; i < 365; i++) {
      mStableSubgraphArgs.push("$day" + i + ": Int!");
      mStableSubgraphReturns += `day` + i + `: exchangeRates(where: {timestamp_lt: $day` + i + `}, orderDirection: desc, orderBy: timestamp, first: 1) {
        ...ER
        __typename
      }`;
    }

    Promise.all([
      $.getJSON("https://app.rari.capital/dydx-aprs.json?v=" + epochToday),
      $.getJSON("https://app.rari.capital/compound-aprs.json?v=" + epochToday),
      $.getJSON("https://app.rari.capital/aave-aprs.json?v=" + epochToday),
      $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", { data: JSON.stringify({
        "operationName": "ExchangeRates",
        "variables": mStableSubgraphVariables,
        "query": "query ExchangeRates(" + mStableSubgraphArgs.join(", ") + ") {" + mStableSubgraphReturns + "}\nfragment ER on ExchangeRate {\n  exchangeRate\n  timestamp\n  __typename\n}"
      }), contentType: 'application/json', type: 'POST' })
    ]).then(function(values) {
      var ourData = {};

      var dydxAvgs = [];
      var epochs = Object.keys(values[0]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (const currencyCode of Object.keys(values[0][epochs[i]])) {
          sum += values[0][epochs[i]][currencyCode];
          if (values[0][epochs[i]][currencyCode] > max) max = values[0][epochs[i]][currencyCode];
        }

        dydxAvgs.push({ t: new Date(parseInt(epochs[i])), y: sum / Object.keys(values[0][epochs[i]]).length * 100 });

        // Add data for Rari graph
        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        ourData[flooredEpoch] = max;
      }

      var compoundAvgs = [];
      var epochs = Object.keys(values[1]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for Compound graph and max with COMP for our graph
        var sum = 0;
        var maxWithComp = 0;

        for (const currencyCode of Object.keys(values[1][epochs[i]])) {
          sum += values[1][epochs[i]][currencyCode][0];
          var apyWithComp = values[1][epochs[i]][currencyCode][0] + values[1][epochs[i]][currencyCode][1];
          if (apyWithComp > maxWithComp) maxWithComp = apyWithComp;
        }

        var avg = sum / Object.keys(values[1][epochs[i]]).length;
        compoundAvgs.push({ t: new Date(parseInt(epochs[i])), y: avg * 100 });

        // Add data for Rari graph
        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || maxWithComp > ourData[flooredEpoch]) ourData[flooredEpoch] = maxWithComp;
      }

      var aaveAvgs = [];
      var epochs = Object.keys(values[2]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (const currencyCode of Object.keys(values[2][epochs[i]])) {
          sum += values[2][epochs[i]][currencyCode];
          if (values[2][epochs[i]][currencyCode] > max) max = values[2][epochs[i]][currencyCode];
        }

        aaveAvgs.push({ t: new Date(parseInt(epochs[i])), y: sum / Object.keys(values[2][epochs[i]]).length * 100 });

        // Add data for Rari graph
        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || max > ourData[flooredEpoch]) ourData[flooredEpoch] = max;
      }

      if (!values[3] || !values[3].data) return console.error("Failed to decode exchange rates from The Graph when calculating mStable 24-hour APY");
      var mStableAvgs = [];
      
      for (var i = 1; i < mStableEpochs.length; i++) {
        // mStable graph
        // 1590759420 == timestamp of launch Twitter annoucement: https://twitter.com/sassal0x/status/1266362912920137734
        var apy = values[3].data["day" + (i - 1)][0] && values[3].data["day" + i][0] && mStableEpochs[365 - i] >= 1590759420 ? App.calculateMStableApyBN(mStableEpochs[365 - i], values[3].data["day" + (i - 1)][0].exchangeRate, mStableEpochs[364 - i], values[3].data["day" + i][0].exchangeRate).toString() / 1e18 : 0;
        mStableAvgs.push({ t: new Date(parseInt(mStableEpochs[364 - i]) * 1000), y: apy * 100 });

        // Add data for Rari graph
        var flooredEpoch = Math.floor(mStableEpochs[364 - i] / 86400) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || apy > ourData[flooredEpoch]) ourData[flooredEpoch] = apy;
      }

      // Turn Rari data into object for graph
      var ourAvgs = [];
      var epochs = Object.keys(ourData).sort();
      for (var i = 0; i < epochs.length; i++) ourAvgs.push({ t: new Date(parseInt(epochs[i])), y: ourData[epochs[i]] * 100 });

      // Display today's estimated APY
      // TODO: Display real APY
      $('#APYToday').text((ourData[epochs[epochs.length - 1]] * 100).toFixed(2) + "%");

      // Init chart
      var ctx = document.getElementById('chart-aprs').getContext('2d');
      var color = Chart.helpers.color;

      var cfg = {
        data: {
          datasets: [{
            label: 'Rari',
            backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
            borderColor: window.chartColors.green,
            data: ourAvgs,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'dYdX',
            backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            borderColor: window.chartColors.blue,
            data: dydxAvgs,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'Compound',
            backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
            borderColor: window.chartColors.red,
            data: compoundAvgs,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'Aave',
            backgroundColor: color(window.chartColors.yellow).alpha(0.5).rgbString(),
            borderColor: window.chartColors.yellow,
            data: aaveAvgs,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'mStable',
            backgroundColor: color(window.chartColors.purple).alpha(0.5).rgbString(),
            borderColor: window.chartColors.purple,
            data: mStableAvgs,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }]
        },
        options: {
          aspectRatio: 3,
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'LL'
              },
              distribution: 'series',
              offset: true,
              ticks: {
                autoSkip: true,
                autoSkipPadding: 20,
                maxRotation: 0
              },
              gridLines: {
                color: '#333'
              }
            }],
            yAxes: [{
              gridLines: {
                color: '#333',
                drawBorder: false
              },
              scaleLabel: {
                display: true,
                labelString: 'APY (%)'
              }
            }]
          },
          tooltips: {
            intersect: false,
            mode: 'index',
            callbacks: {
              label: function(tooltipItem, myData) {
                var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                if (label) {
                  label += ': ';
                }
                label += parseFloat(tooltipItem.value).toFixed(2) + "%";
                return label;
              }
            }
          }
        }
      };

      var chart = new Chart(ctx, cfg);

      // Convert APR chart data into return chart data
      var dydxReturns = [];
      var currentReturn = 10000;
      for (var i = 0; i < dydxAvgs.length; i++) dydxReturns.push({ t: dydxAvgs[i].t, y: currentReturn *= (1 + (dydxAvgs[i].y / 100) / 365) });
      var compoundReturns = [];
      currentReturn = 10000;
      for (var i = 0; i < compoundAvgs.length; i++) compoundReturns.push({ t: compoundAvgs[i].t, y: currentReturn *= (1 + (compoundAvgs[i].y / 100) / 365) });
      var aaveReturns = [];
      currentReturn = 10000;
      for (var i = 0; i < aaveAvgs.length; i++) aaveReturns.push({ t: aaveAvgs[i].t, y: currentReturn *= (1 + (aaveAvgs[i].y / 100) / 365) });
      var mStableReturns = [];
      currentReturn = 10000;
      for (var i = 0; i < mStableAvgs.length; i++) mStableReturns.push({ t: mStableAvgs[i].t, y: currentReturn *= (1 + (mStableAvgs[i].y / 100) / 365) });
      var ourReturns = [];
      currentReturn = 10000;
      for (var i = 0; i < ourAvgs.length; i++) ourReturns.push({ t: ourAvgs[i].t, y: currentReturn *= (1 + (ourAvgs[i].y / 100) / 365) });

      // Init chart
      var ctx = document.getElementById('chart-return').getContext('2d');
      var color = Chart.helpers.color;

      var cfg = {
        data: {
          datasets: [{
            label: 'Rari',
            backgroundColor: color(window.chartColors.green).alpha(0.5).rgbString(),
            borderColor: window.chartColors.green,
            data: ourReturns,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'dYdX',
            backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            borderColor: window.chartColors.blue,
            data: dydxReturns,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'Compound',
            backgroundColor: color(window.chartColors.red).alpha(0.5).rgbString(),
            borderColor: window.chartColors.red,
            data: compoundReturns,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'Aave',
            backgroundColor: color(window.chartColors.yellow).alpha(0.5).rgbString(),
            borderColor: window.chartColors.yellow,
            data: aaveReturns,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }, {
            label: 'mStable',
            backgroundColor: color(window.chartColors.purple).alpha(0.5).rgbString(),
            borderColor: window.chartColors.purple,
            data: mStableReturns,
            type: 'line',
            pointRadius: 0,
            fill: false,
            lineTension: 0,
            borderWidth: 2
          }]
        },
        options: {
          aspectRatio: 3,
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'LL'
              },
              distribution: 'series',
              offset: true,
              ticks: {
                autoSkip: true,
                autoSkipPadding: 20,
                maxRotation: 0
              },
              gridLines: {
                color: '#333'
              }
            }],
            yAxes: [{
              gridLines: {
                color: '#333',
                drawBorder: false
              },
              scaleLabel: {
                display: true,
                labelString: 'Balance (USD)'
              }
            }]
          },
          tooltips: {
            intersect: false,
            mode: 'index',
            callbacks: {
              label: function(tooltipItem, myData) {
                var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                if (label) {
                  label += ': ';
                }
                label += "$" + new Big(tooltipItem.value).toFormat(2);
                return label;
              }
            }
          }
        }
      };

      var chart = new Chart(ctx, cfg);
    });
  },

  /**
   * Initialize Web3Modal.
   */
  initWeb3Modal: function() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "c52a3970da0a47978bee0fe7988b67b6"
        }
      },
  
      fortmatic: {
        package: Fortmatic,
        options: {
          key: "pk_live_A5F3924825DC427D"
        }
      },

      torus: {
        package: Torus,
        options: {}
      },

      portis: {
        package: Portis,
        options: {
          id: "1fd446cc-629b-46bc-a50c-6b7fe9251f05"
        }
      },

      authereum: {
        package: Authereum,
        options: {}
      }
    };
  
    App.web3Modal = new Web3Modal({
      cacheProvider: false, // optional
      providerOptions, // required
    });
  },

  /**
   * Kick in the UI action after Web3modal dialog has chosen a provider
   */
  fetchAccountData: async function() {
    // Get a Web3 instance for the wallet
    App.web3 = new Web3(App.web3Provider);
    const approveFunction = async ({ from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress }) => {
      try {
        var response = await $.ajax('checkSig.php', { data: JSON.stringify({ from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress }), contentType: 'application/json', type: 'POST' });
      } catch (error) {
        return console.error("checkSig error:", error);
      }
  
      console.log("checkSig response:", response);
      return response;
    };
    App.web3Gsn = new Web3(new OpenZeppelinGSNProvider.GSNProvider(App.web3Provider, { approveFunction }));
  
    // Get connected chain ID from Ethereum node
    const chainId = await App.web3.eth.getChainId();

    /* if (chainId !== 1) {
      $('#depositButton, #withdrawButton, #transferButton').prop("disabled", true);
      toastr["error"]("Invalid chain selected.", "Ethereum connection failed");
    } */
  
    // Get list of accounts of the connected wallet
    // MetaMask does not give you all accounts, only the selected account
    App.accounts = await App.web3.eth.getAccounts();
    App.selectedAccount = App.accounts[0];

    // Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.identify(App.selectedAccount);
      mixpanel.people.set({
        "Ethereum Address": App.selectedAccount,
        "App Version": "1.2.0"
      });
    }

    // Refresh contracts to use new Web3
    for (const symbol of Object.keys(App.contracts)) App.contracts[symbol] = new App.web3.eth.Contract(App.contracts[symbol].options.jsonInterface, App.contracts[symbol].options.address);
    App.contractsGsn.RariFundProxy = new App.web3Gsn.eth.Contract(App.contracts.RariFundProxy.options.jsonInterface, App.contracts.RariFundProxy.options.address);
    for (const symbol of Object.keys(App.tokens)) if (App.tokens[symbol].contract) App.tokens[symbol].contract = new App.web3.eth.Contract(App.tokens[symbol].contract.options.jsonInterface, App.tokens[symbol].address);

    // Get user's account balance in the stablecoin fund and RFT balance
    if (App.contracts.RariFundManager) {
      App.getMyFundBalance();
      if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
      /* App.getMyInterestAccrued();
      if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000); */
    }
    if (App.contracts.RariFundToken) {
      App.getTokenBalance();
      if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
    }
  
    // Load acounts dropdown
    $('#selected-account').empty();
    for (var i = 0; i < App.accounts.length; i++) $('#selected-account').append('<option' + (i == 0 ? ' selected' : '') + '>' + App.accounts[i] + '</option>');
  
    // Display fully loaded UI for wallet data
    $('#depositButton, #withdrawButton, #transferButton').prop("disabled", false);
  },
  
  /**
   * Fetch account data for UI when
   * - User switches accounts in wallet
   * - User switches networks in wallet
   * - User connects wallet initially
   */
  refreshAccountData: async function() {
    // If any current data is displayed when
    // the user is switching acounts in the wallet
    // immediate hide this data
    $("#MyDAIBalance, #MyUSDCBalance, #MyUSDTBalance, #RSFTBalance").text("?");
  
    // Disable button while UI is loading.
    // fetchAccountData() will take a while as it communicates
    // with Ethereum node via JSON-RPC and loads chain data
    // over an API call.
    $(".btn-connect").text("Loading...");
    $(".btn-connect").prop("disabled", true);
    await App.fetchAccountData();
    $(".btn-connect").hide();
    $(".btn-connect").text("Connect Wallet");
    $(".btn-connect").prop("disabled", false);
    $("#btn-disconnect").show();
    $('.show-account').show();
    $('#page-fund').hide();
    $('#page-account').show();
    $('#tab-fund').css('text-decoration', '');
    $('#tab-account').css('text-decoration', 'underline');
  },
  
  /**
   * Connect wallet button pressed.
   */
  connectWallet: async function() {
    // Setting this null forces to show the dialogue every time
    // regardless if we play around with a cacheProvider settings
    // in our localhost.
    // TODO: A clean API needed here
    App.web3Modal.providerController.cachedProvider = null;
  
    try {
      App.web3Provider = await App.web3Modal.connect();
    } catch(e) {
      console.error("Could not get a wallet connection", e);
      return;
    }

    if (App.web3Provider.on) {
      // Subscribe to accounts change
      App.web3Provider.on("accountsChanged", (accounts) => {
        App.fetchAccountData();
      });
    
      // Subscribe to chainId change
      App.web3Provider.on("chainChanged", (chainId) => {
        App.fetchAccountData();
      });
    
      // Subscribe to networkId change
      App.web3Provider.on("networkChanged", (networkId) => {
        App.fetchAccountData();
      });
    }
  
    await App.refreshAccountData();
  },
  
  /**
   * Disconnect wallet button pressed.
   */
  disconnectWallet: async function() {
    console.log("Killing the wallet connection", App.web3Provider);
  
    // TODO: MetamaskInpageProvider does not provide disconnect?
    if (App.web3Provider.close) {
      await App.web3Provider.close();
      App.web3Provider = null;
    }
  
    App.selectedAccount = null;
  
    // Set the UI back to the initial state
    $("#selected-account").html('<option disabled selected>Please connect your wallet...</option>');
    $('.show-account').hide();
    $("#btn-disconnect").hide();
    $(".btn-connect").show();
    $('#MyUSDBalance').text("?");
    $('#RSFTBalance').text("?");
    $('#MyInterestAccrued').text("?");
  },
  
  /**
   * Initialize the latest version of web3.js (MetaMask uses an oudated one that overwrites ours if we include it as an HTML tag), then initialize and connect Web3Modal.
   */
  initWeb3: function() {
    $.getScript("js/web3.min.js", function() {
      if (typeof web3 !== 'undefined') {
        App.web3 = new Web3(web3.currentProvider);
      } else {
        App.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/c52a3970da0a47978bee0fe7988b67b6"));
      }
  
      App.initContracts();
      App.initWeb3Modal();
      App.initAprChart();
    });
  },
  
  /**
   * Initialize FundManager and FundToken contracts.
   */
  initContracts: function() {
    $.getJSON('abi/RariFundManager.json?v=1599624605', function(data) {
      App.contracts.RariFundManager = new App.web3.eth.Contract(data, "0x93F1A63007f37596C72c4CC90DE29706454ab033");
      App.getFundBalance();
      setInterval(App.getFundBalance, 5 * 60 * 1000);
      if (App.selectedAccount) {
        App.getMyFundBalance();
        if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
        /* App.getMyInterestAccrued();
        if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000); */
      }
      App.getDirectlyDepositableCurrencies();
      App.getDirectlyWithdrawableCurrencies();
      setInterval(function() {
        App.getDirectlyDepositableCurrencies();
        App.getDirectlyWithdrawableCurrencies();
      }, 5 * 60 * 1000);
    });

    $.getJSON('abi/RariFundToken.json?v=1595276956', function(data) {
      App.contracts.RariFundToken = new App.web3.eth.Contract(data, "0x9366B7C00894c3555c7590b0384e5F6a9D55659f");
      if (App.selectedAccount) {
        App.getTokenBalance();
        if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
      }
    });

    $.getJSON('abi/RariFundProxy.json?v=1599624605', function(data) {
      App.contracts.RariFundProxy = new App.web3.eth.Contract(data, "0xeB185c51d5640Cf5555972EC8DdD9B1b901F5730");
      App.getCurrentApy();
      setInterval(App.getCurrentApy, 5 * 60 * 1000);
    });

    $.getJSON('abi/ERC20.json', function(data) {
      App.erc20Abi = data;
      for (const symbol of Object.keys(App.tokens)) App.tokens[symbol].contract = new App.web3.eth.Contract(data, App.tokens[symbol].address);
    });

    $.getJSON('https://api.0x.org/swap/v0/tokens', function(data) {
      data.records.sort((a, b) => a.symbol > b.symbol ? 1 : -1);
      for (const token of data.records) {
        if (App.tokens[token.symbol]) continue;
        App.tokens[token.symbol] = { address: token.address, decimals: token.decimals, contract: App.erc20Abi ? new App.web3.eth.Contract(App.erc20Abi, token.address) : null };
        $('#DepositToken').append('<option>' + token.symbol + '</option>');
        $('#WithdrawToken').append('<option>' + token.symbol + '</option>');
      }
    });

    $.getJSON('abi/MassetValidationHelper.json', function(data) {
      App.contracts.MassetValidationHelper = new App.web3.eth.Contract(data, "0xabcc93c3be238884cc3309c19afd128fafc16911");
    });
  },

  getDirectlyDepositableCurrencies: async function() {
    App.acceptedCurrencies = await App.contracts.RariFundManager.methods.getAcceptedCurrencies().call();
    for (const currencyCode of ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"])
      $('#DepositToken > option[value="' + currencyCode + '"]').text(currencyCode + (App.acceptedCurrencies.indexOf(currencyCode) >= 0 ? " (no slippage)" : ""));
  },

  getDirectlyWithdrawableCurrencies: async function() {
    for (const currencyCode of ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"]) {
      var rawFundBalance = await App.contracts.RariFundManager.methods["getRawFundBalance(string)"](currencyCode).call();
      $('#WithdrawToken > option[value="' + currencyCode + '"]').text(currencyCode + (parseFloat(rawFundBalance) > 0 ? " (no slippage up to " + (parseFloat(rawFundBalance) / (10 ** App.tokens[currencyCode].decimals) >= 10 ? (parseFloat(rawFundBalance) / (10 ** App.tokens[currencyCode].decimals)).toFixed(2) : (parseFloat(rawFundBalance) / (10 ** App.tokens[currencyCode].decimals)).toPrecision(4)) + ")" : ""));
    }
  },
  
  /**
   * Bind button click events.
   */
  bindEvents: function() {
    $(document).on('click', '.btn-connect', App.connectWallet);
    $(document).on('click', '#btn-disconnect', App.disconnectWallet);

    $(document).on('change', '#selected-account', function() {
      // Set selected account
      App.selectedAccount = $(this).val();

      // Mixpanel
      if (typeof mixpanel !== 'undefined') {
        mixpanel.identify(App.selectedAccount);
        mixpanel.people.set({
          "Ethereum Address": App.selectedAccount,
          "App Version": "1.2.0"
        });
      }

      // Get user's account balance in the stablecoin fund and RFT balance
      if (App.contracts.RariFundManager) {
        App.getMyFundBalance();
        if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
        /* App.getMyInterestAccrued();
        if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000); */
      }
      if (App.contracts.RariFundToken) {
        App.getTokenBalance();
        if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
      }
    });

    $(document).on('click', '#depositButton, #confirmDepositButton', App.handleDeposit);
    $(document).on('click', '#withdrawButton, #confirmWithdrawalButton', App.handleWithdraw);
    $(document).on('click', '#transferButton', App.handleTransfer);
  },

  get0xPrices: function(inputTokenSymbol) {
    return new Promise((resolve, reject) => {
      $.getJSON('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, function(decoded) {
        if (!decoded) return reject("Failed to decode prices from 0x swap API");
        if (!decoded.records) return reject("No prices found on 0x swap API");
        var prices = {};
        for (var i = 0; i < decoded.records.length; i++) prices[decoded.records[i].symbol] = decoded.records[i].price;
        resolve(prices);
      }).fail(function(err) {
        reject("Error requesting prices from 0x swap API: " + err.message);
      });
    });
  },

  get0xSwapOrders: function(inputTokenAddress, outputTokenAddress, maxInputAmountBN, maxMakerAssetFillAmountBN) {
    return new Promise((resolve, reject) => {
      $.getJSON('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + (maxMakerAssetFillAmountBN !== undefined ? '&buyAmount=' + maxMakerAssetFillAmountBN.toString() : '&sellAmount=' + maxInputAmountBN.toString()), function(decoded) {
        if (!decoded) return reject("Failed to decode quote from 0x swap API");
        if (!decoded.orders) return reject("No orders found on 0x swap API");

        decoded.orders.sort((a, b) => a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee) ? 1 : -1);

        var orders = [];
        var inputFilledAmountBN = Web3.utils.toBN(0);
        var takerAssetFilledAmountBN = Web3.utils.toBN(0);
        var makerAssetFilledAmountBN = Web3.utils.toBN(0);

        for (var i = 0; i < decoded.orders.length; i++) {
          if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData.toLowerCase() !== "0xf47261b0000000000000000000000000" + inputTokenAddress.toLowerCase()) continue;
          var takerAssetAmountBN = Web3.utils.toBN(decoded.orders[i].takerAssetAmount);
          var takerFeeBN = Web3.utils.toBN(decoded.orders[i].takerFee);
          var orderInputAmountBN = takerAssetAmountBN.add(takerFeeBN); // Maximum amount we can send to this order including the taker fee
          var makerAssetAmountBN = Web3.utils.toBN(decoded.orders[i].makerAssetAmount);

          if (maxMakerAssetFillAmountBN !== undefined) {
            // maxMakerAssetFillAmountBN is specified, so use it
            if (maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN).lte(makerAssetAmountBN)) {
              // Calculate orderTakerAssetFillAmountBN and orderInputFillAmountBN from maxMakerAssetFillAmountBN
              var orderMakerAssetFillAmountBN = maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN);
              var orderTakerAssetFillAmountBN = orderMakerAssetFillAmountBN.mul(takerAssetAmountBN).div(makerAssetAmountBN);
              var orderInputFillAmountBN = orderMakerAssetFillAmountBN.mul(orderInputAmountBN).div(makerAssetAmountBN);
              
              var tries = 0;
              while (makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).lt(orderMakerAssetFillAmountBN)) {
                if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount", "Internal error");
                orderInputFillAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount
                tries++;
              }
            } else {
              // Fill whole order
              var orderMakerAssetFillAmountBN = makerAssetAmountBN;
              var orderTakerAssetFillAmountBN = takerAssetAmountBN;
              var orderInputFillAmountBN = orderInputAmountBN;
            }

            // If this order input amount is higher than the remaining input, calculate orderTakerAssetFillAmountBN and orderMakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
            if (orderInputFillAmountBN.gt(maxInputAmountBN.sub(inputFilledAmountBN))) {
              orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
              orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
              orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
            }
          } else {
            // maxMakerAssetFillAmountBN is not specified, so use maxInputAmountBN
            if (maxInputAmountBN.sub(inputFilledAmountBN).lte(orderInputAmountBN)) {
              // Calculate orderInputFillAmountBN and orderTakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
              var orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
              var orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
              var orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
            } else {
              // Fill whole order
              var orderInputFillAmountBN = orderInputAmountBN;
              var orderTakerAssetFillAmountBN = takerAssetAmountBN;
              var orderMakerAssetFillAmountBN = makerAssetAmountBN;
            }
          }

          // Add order to returned array
          orders.push(decoded.orders[i]);

          // Add order fill amounts to total fill amounts
          inputFilledAmountBN.iadd(orderInputFillAmountBN);
          takerAssetFilledAmountBN.iadd(orderTakerAssetFillAmountBN);
          makerAssetFilledAmountBN.iadd(orderMakerAssetFillAmountBN);
          
          // Check if we have hit maxInputAmountBN or maxTakerAssetFillAmountBN
          if (inputFilledAmountBN.gte(maxInputAmountBN) || (maxMakerAssetFillAmountBN !== undefined && makerAssetFilledAmountBN.gte(maxMakerAssetFillAmountBN))) break;
        }

        if (takerAssetFilledAmountBN.isZero()) return reject("No orders found on 0x swap API");
        resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, decoded.gasPrice]);
      }).fail(function(err) {
          reject("Error requesting quote from 0x swap API: " + err.message);
      });
    });
  },

  getMStableSwapFeeBN: async function() {
    const data = await $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", { data: JSON.stringify({ query: `{
      massets(where: { id: "0xe2f2a5c287993345a840db3b0845fbc70f5935a5" }) {
        feeRate
      }
    }` }), contentType: 'application/json', type: 'POST' });

    return Web3.utils.toBN(data.data.massets[0].feeRate);
  },
  
  /**
   * Deposit funds to the stablecoin fund.
   */
  handleDeposit: async function(event) {
    event.preventDefault();

    var token = $('#DepositToken').val();
    if (token !== "ETH" && !App.tokens[token]) return toastr["error"]("Invalid token!", "Deposit failed");
    var amount = parseFloat($('#DepositAmount').val());
    if (!amount || amount <= 0) return toastr["error"]("Deposit amount must be greater than 0!", "Deposit failed");
    var amountBN = Web3.utils.toBN((new Big(amount)).mul((new Big(10)).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
    var accountBalanceBN = Web3.utils.toBN(await (token == "ETH" ? App.web3.eth.getBalance(App.selectedAccount) : App.tokens[token].contract.methods.balanceOf(App.selectedAccount).call()));
    if (amountBN.gt(accountBalanceBN)) return toastr["error"]("Not enough balance in your account to make a deposit of this amount. Current account balance: " + (new Big(accountBalanceBN.toString())).div((new Big(10)).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toString() + " " + token, "Deposit failed");

    $('#depositButton, #confirmDepositButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');

    await (async function() {
      // Check if currency is directly depositable
      await App.getDirectlyDepositableCurrencies();
      if (!App.acceptedCurrencies) return toastr["error"]("No accepted currencies found.", "Deposit failed");

      if (App.acceptedCurrencies.indexOf(token) >= 0) {
        if ($('#modal-confirm-deposit').is(':visible')) $('#modal-confirm-deposit').modal('hide');

        var myFundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call());
        if (App.checkAccountBalanceLimit && myFundBalanceBN.add(amountBN.mul(App.chainlinkPricesInUsd[token]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[token].decimals)))).gt(Web3.utils.toBN(350e18))) return toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed");
        console.log('Deposit ' + amount + ' ' + token + ' directly');
        var depositContract = amount >= 250 && myFundBalanceBN.isZero() ? App.contractsGsn.RariFundProxy : App.contracts.RariFundManager;

        // Approve tokens to RariFundManager
        try {
          var allowanceBN = Web3.utils.toBN(await App.tokens[token].contract.methods.allowance(App.selectedAccount, depositContract.options.address).call());
          if (allowanceBN.lt(amountBN)) await App.tokens[token].contract.methods.approve(depositContract.options.address, amountBN).send({ from: App.selectedAccount });
        } catch (err) {
          return toastr["error"]("Failed to approve tokens: " + (err.message ? err.message : err), "Deposit failed");
        }
        
        // Deposit tokens to RariFundManager
        try {
          var receipt = await depositContract.methods.deposit(token, amountBN).send({ from: App.selectedAccount });
        } catch (err) {
          return toastr["error"](err.message ? err.message : err, "Deposit failed");
        }

        // Mixpanel
        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct deposit", { transactionHash: receipt.transactionHash, currencyCode: token, amount });
      } else {
        // Get mStable output currency if possible
        var mStableOutputCurrency = null;
        var mStableOutputAmountAfterFeeBN = null;

        if (["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(token) >= 0) {
          for (var acceptedCurrency of App.acceptedCurrencies) if (["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(acceptedCurrency) >= 0) {
            if (token === "mUSD") {
              try {
                var redeemValidity = await App.contracts.MassetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", amountBN, App.tokens[acceptedCurrency].address).call();
              } catch (err) {
                console.error("Failed to check mUSD redeem validity:", err);
                continue;
              }

              if (!redeemValidity || !redeemValidity["0"]) continue;
              mStableOutputAmountAfterFeeBN = Web3.utils.toBN(redeemValidity["2"]);
            } else {
              try {
                var maxSwap = await App.contracts.MassetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", App.tokens[token].address, App.tokens[acceptedCurrency].address).call();
              } catch (err) {
                console.error("Failed to check mUSD max swap:", err);
                continue;
              }

              if (!maxSwap || !maxSwap["0"] || amountBN.gt(Web3.utils.toBN(maxSwap["2"]))) continue;
              mStableOutputAmountAfterFeeBN = Web3.utils.toBN(maxSwap["3"]);
            }

            mStableOutputCurrency = acceptedCurrency;
            break;
          }
        }

        // Ideally mStable, but 0x works too
        if (mStableOutputCurrency !== null) {
          // Check account balance limit
          if (App.checkAccountBalanceLimit) {
            var myFundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call());
            var outputAmountUsdBN = mStableOutputAmountAfterFeeBN.mul(App.chainlinkPricesInUsd[mStableOutputCurrency]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[mStableOutputCurrency].decimals)));
            if (myFundBalanceBN.add(outputAmountUsdBN).gt(Web3.utils.toBN(350e18))) return toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed");
          }

          // Warn user of slippage
          var epochNow = (new Date()).getTime();

          if (!App.zeroExPrices[token] || epochNow > App.zeroExPrices[token]._lastUpdated + (60 * 1000)) {
            try {
              App.zeroExPrices[token] = await App.get0xPrices(token);
              App.zeroExPrices[token]._lastUpdated = epochNow;
            } catch (err) {
              if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) < 0) return toastr["error"]("Failed to get prices from 0x swap API: " + err, "Deposit failed");
            }
          }

          var amountOutputted = parseFloat(mStableOutputAmountAfterFeeBN.toString()) / 10 ** App.tokens[mStableOutputCurrency].decimals;
          if (App.zeroExPrices[token] && App.zeroExPrices[token][mStableOutputCurrency]) var slippage = 1 - (amountOutputted / amount * App.zeroExPrices[token][mStableOutputCurrency]);
          else if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0) var slippage = 1 - (amountOutputted / amount);
          else return toastr["error"]("Price not found on 0x swap API", "Deposit failed");

          var slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

          if (!$('#modal-confirm-deposit').is(':visible')) {
            $('#DepositZeroExGasPriceWarning').attr("style", "display: none !important;");
            $('#DepositExchangeFee').hide();
            $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
            return $('#modal-confirm-deposit').modal('show');
          }

          if ($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%") {
            $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
            return toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to process your deposit.", "Please try again");
          }

          // Approve tokens to RariFundProxy
          try {
            var allowanceBN = Web3.utils.toBN(await App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call());
            if (allowanceBN.lt(amountBN)) await App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({ from: App.selectedAccount });
          } catch (err) {
            return toastr["error"]("Failed to approve tokens to RariFundProxy: " + (err.message ? err.message : err), "Deposit failed");
          }

          // Exchange and deposit tokens via mStable via RariFundProxy
          try {
            console.log("RariFundProxy.exchangeAndDeposit parameters:", token, amountBN.toString(), mStableOutputCurrency);
            var receipt = await App.contracts.RariFundProxy.methods["exchangeAndDeposit(string,uint256,string)"](token, amountBN, mStableOutputCurrency).send({ from: App.selectedAccount });
          } catch (err) {
            return toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + (err.message ? err.message : err), "Deposit failed");
          }
        } else {
          // Use first accepted currency for 0x
          var acceptedCurrency = App.acceptedCurrencies[0];

          // Get orders from 0x swap API
          try {
            var [orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice] = await App.get0xSwapOrders(token === "ETH" ? "WETH" : App.tokens[token].address, App.tokens[acceptedCurrency].address, amountBN);
          } catch (err) {
            return toastr["error"]("Failed to get swap orders from 0x API: " + err, "Deposit failed");
          }

          // Check account balance limit
          if (App.checkAccountBalanceLimit) {
            var myFundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call());
            var makerAssetFilledAmountUsdBN = makerAssetFilledAmountBN.mul(App.chainlinkPricesInUsd[acceptedCurrency]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[acceptedCurrency].decimals)));
            if (myFundBalanceBN.add(makerAssetFilledAmountUsdBN).gt(Web3.utils.toBN(350e18))) return toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed");
          }

          var amountOutputted = makerAssetFilledAmountBN.toString() / (10 ** App.tokens[acceptedCurrency].decimals);
          
          // Make sure input amount is completely filled
          if (inputFilledAmountBN.lt(amountBN)) {
            $('#DepositAmount').val(inputFilledAmountBN.toString() / (10 ** (token == "ETH" ? 18 : App.tokens[token].decimals)));
            return toastr["warning"]("Unable to find enough liquidity to exchange " + token + " before depositing.", "Deposit canceled");
          }

          // Warn user of slippage
          var epochNow = (new Date()).getTime();

          if (!App.zeroExPrices[token === "ETH" ? "WETH" : token] || epochNow > App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated + (60 * 1000)) {
            try {
              App.zeroExPrices[token === "ETH" ? "WETH" : token] = await App.get0xPrices(token === "ETH" ? "WETH" : token);
              App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated = epochNow;
            } catch (err) {
              if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) < 0) return toastr["error"]("Failed to get prices from 0x swap API: " + err, "Deposit failed");
            }
          }

          if (App.zeroExPrices[token === "ETH" ? "WETH" : token] && App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency]) var slippage = 1 - (amountOutputted / amount * App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency]);
          else if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0) var slippage = 1 - (amountOutputted / amount);
          else return toastr["error"]("Price not found on 0x swap API", "Deposit failed");

          var slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

          if (!$('#modal-confirm-deposit').is(':visible')) {
            $('#DepositZeroExGasPriceWarning').attr("style", "display: block !important;")
            $('#DepositExchangeFee kbd').html((protocolFee / 1e18) + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
            $('#DepositExchangeFee').show();
            $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
            return $('#modal-confirm-deposit').modal('show');
          }

          if ($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%") {
            $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
            return toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to process your deposit.", "Please try again");
          }

          if ($('#DepositExchangeFee kbd').html().substring(0, $('#DepositExchangeFee kbd').html().indexOf("<") - 1) !== (protocolFee / 1e18) + " ETH") {
            $('#DepositExchangeFee kbd').html((protocolFee / 1e18) + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
            return toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to process your deposit.", "Please try again");
          }

          console.log('Exchange ' + amount + ' ' + token + ' to deposit ' + amountOutputted + ' ' + acceptedCurrency);

          // Approve tokens to RariFundProxy if token is not ETH
          if (token !== "ETH") try {
            var allowanceBN = Web3.utils.toBN(await App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call());
            if (allowanceBN.lt(amountBN)) await App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({ from: App.selectedAccount });
          } catch (err) {
            return toastr["error"]("Failed to approve tokens to RariFundProxy: " + (err.message ? err.message : err), "Deposit failed");
          }

          // Build array of orders and signatures
          var signatures = [];

          for (var j = 0; j < orders.length; j++) {
            signatures[j] = orders[j].signature;
            
            orders[j] = {
              makerAddress: orders[j].makerAddress,
              takerAddress: orders[j].takerAddress,
              feeRecipientAddress: orders[j].feeRecipientAddress,
              senderAddress: orders[j].senderAddress,
              makerAssetAmount: orders[j].makerAssetAmount,
              takerAssetAmount: orders[j].takerAssetAmount,
              makerFee: orders[j].makerFee,
              takerFee: orders[j].takerFee,
              expirationTimeSeconds: orders[j].expirationTimeSeconds,
              salt: orders[j].salt,
              makerAssetData: orders[j].makerAssetData,
              takerAssetData: orders[j].takerAssetData,
              makerFeeAssetData: orders[j].makerFeeAssetData,
              takerFeeAssetData: orders[j].takerFeeAssetData
            };
          }

          // Exchange and deposit tokens via RariFundProxy
          try {
            console.log("RariFundProxy.exchangeAndDeposit parameters:", token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN.toString(), acceptedCurrency, orders, signatures, takerAssetFilledAmountBN.toString());
            var receipt = await App.contracts.RariFundProxy.methods.exchangeAndDeposit(token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN, acceptedCurrency, orders, signatures, takerAssetFilledAmountBN).send({ from: App.selectedAccount, value: token === "ETH" ? Web3.utils.toBN(protocolFee).add(amountBN).toString() : protocolFee, gasPrice: gasPrice });
          } catch (err) {
            return toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + (err.message ? err.message : err), "Deposit failed");
          }
        }

        // Mixpanel
        if (typeof mixpanel !== 'undefined') mixpanel.track("Exchange and deposit", { transactionHash: receipt.transactionHash, inputCurrencyCode: token, inputAmount: amount, outputCurrencyCode: acceptedCurrency, outputAmount: amountOutputted });

        // Hide old slippage after exchange success
        $('#modal-confirm-deposit').modal('hide');
      }

      // Alert success and refresh balances
      toastr["success"]("Deposit of " + amount + " " + token + " confirmed!", "Deposit successful");
      $('#USDBalance').text("?");
      App.getFundBalance();
      $('#MyUSDBalance').text("?");
      App.getMyFundBalance();
      $('#RSFTBalance').text("?");
      App.getTokenBalance();
      App.getDirectlyWithdrawableCurrencies();
    })();

    $('#depositButton').text("Deposit");
    $('#confirmDepositButton').text("Confirm");
    $('#depositButton, #confirmDepositButton').prop("disabled", false);
  },
  
  /**
   * Withdraw funds from the stablecoin fund.
   */
  handleWithdraw: async function(event) {
    event.preventDefault();

    var token = $('#WithdrawToken').val();
    if (token !== "ETH" && !App.tokens[token]) return toastr["error"]("Invalid token!", "Withdrawal failed");
    var amount = parseFloat($('#WithdrawAmount').val());
    if (!amount || amount <= 0) return toastr["error"]("Withdrawal amount must be greater than 0!", "Withdrawal failed");
    var amountBN = Web3.utils.toBN((new Big(amount)).mul((new Big(10)).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());

    $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');

    await (async function() {
      App.getDirectlyWithdrawableCurrencies();

      // Approve RFT to RariFundManager
      try {
        var allowanceBN = Web3.utils.toBN(await App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call());
        if (allowanceBN.lt(Web3.utils.toBN(2).pow(Web3.utils.toBN(255)).subn(1))) await App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1)).send({ from: App.selectedAccount });
      } catch (error) {
        return toastr["error"]("Failed to approve RSFT to RariFundManager: " + (error.message ? error.message : error), "Withdrawal failed");
      }

      // See how much we can withdraw directly if token is not ETH
      var tokenRawFundBalanceBN = Web3.utils.toBN(0);

      if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0) {
        try {
          tokenRawFundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods["getRawFundBalance(string)"](token).call());
        } catch (error) {
          return toastr["error"]("Failed to get raw fund balance of output currency: " + error, "Withdrawal failed");
        }
      }

      if (tokenRawFundBalanceBN.gte(amountBN)) {
        // If we can withdraw everything directly, do so
        if ($('#modal-confirm-withdrawal').is(':visible')) $('#modal-confirm-withdrawal').modal('hide');
        console.log('Withdraw ' + amountBN + ' of ' + amount + ' ' + token + ' directly');

        try {
          var receipt = await App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({ from: App.selectedAccount });
        } catch (err) {
          return toastr["error"]("RariFundManager.withdraw failed: " + (err.message ? err.message : err), "Withdrawal failed");
        }

        // Mixpanel
        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct withdrawal", { transactionHash: receipt.transactionHash, currencyCode: token, amount });
      } else {
        // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
        var inputCurrencyCodes = [];
        var inputAmountBNs = [];
        var allOrders = [];
        var allSignatures = [];
        var makerAssetFillAmountBNs = [];
        var protocolFeeBNs = [];

        var amountInputtedUsdBN = Web3.utils.toBN(0);
        var amountWithdrawnBN = Web3.utils.toBN(0);
        var totalProtocolFeeBN = Web3.utils.toBN(0);

        // Withdraw as much as we can of the output token first
        if (tokenRawFundBalanceBN.gt(Web3.utils.toBN(0))) {
          inputCurrencyCodes.push(token);
          inputAmountBNs.push(tokenRawFundBalanceBN);
          allOrders.push([]);
          allSignatures.push([]);
          makerAssetFillAmountBNs.push(0);
          protocolFeeBNs.push(0);

          amountInputtedUsdBN.iadd(tokenRawFundBalanceBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(10 ** App.tokens[token].decimals)));
          amountWithdrawnBN.iadd(tokenRawFundBalanceBN);
        }

        // Get input candidates
        var inputCandidates = [];

        for (const inputToken of ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"]) if (inputToken !== token) {
          var rawFundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods["getRawFundBalance(string)"](inputToken).call());
          if (rawFundBalanceBN.gt(Web3.utils.toBN(0))) inputCandidates.push({ currencyCode: inputToken, rawFundBalanceBN });
        }

        // Sort candidates from lowest to highest rawFundBalanceBN
        inputCandidates.sort((a, b) => a.rawFundBalanceBN.gt(b.rawFundBalanceBN) ? 1 : -1);

        // mStable
        var mStableSwapFeeBN = null;

        if (["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(token) >= 0) for (var i = 0; i < inputCandidates.length; i++) {
          if (["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(inputCandidates[i].currencyCode) < 0) continue;

          // Get swap fee and calculate input amount needed to fill output amount
          if (token !== "mUSD" && mStableSwapFeeBN === null) mStableSwapFeeBN = await App.getMStableSwapFeeBN();
          var inputAmountBN = amountBN.sub(amountWithdrawnBN).mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(1e18).sub(mStableSwapFeeBN)).mul(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals)).div(Web3.utils.toBN(10 ** App.tokens[token].decimals));
          var outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(10 ** App.tokens[token].decimals)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals));
          var outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
          
          var tries = 0;
          while (outputAmountBN.lt(amountBN.sub(amountWithdrawnBN))) {
            if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount", "Withdrawal failed");
            inputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input amount to receive amountBN.sub(amountWithdrawnBN)
            outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(10 ** App.tokens[token].decimals)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals));
            outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
            tries++;
          }

          if (inputAmountBN.gt(inputCandidates[i].rawFundBalanceBN)) {
            inputAmountBN = inputCandidates[i].rawFundBalanceBN;
            outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(10 ** App.tokens[token].decimals)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals));
            outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
          }

          // Check max mint/redeem/swap
          if (inputCandidates[i].currencyCode === "mUSD") {
            try {
              var redeemValidity = await App.contracts.MassetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", inputAmountBN, App.tokens[token].address).call();
            } catch (err) {
              console.error("Failed to check mUSD redeem validity:", err);
              continue;
            }

            if (!redeemValidity || !redeemValidity["0"]) continue;
          } else {
            try {
              var maxSwap = await App.contracts.MassetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", App.tokens[inputCandidates[i].currencyCode].address, App.tokens[token].address).call();
            } catch (err) {
              console.error("Failed to check mUSD max swap:", err);
              continue;
            }

            if (!maxSwap || !maxSwap["0"]) continue;
            var maxSwapInputBN = Web3.utils.toBN(maxSwap["2"]);
            if (maxSwapInputBN.isZero()) continue;

            // Set input and output amounts to maximums
            if (inputAmountBN.gt(maxSwapInputBN)) {
              inputAmountBN = maxSwapInputBN;
              outputAmountBN = Web3.utils.toBN(maxSwap["3"]);
            }
          }
          
          inputCurrencyCodes.push(inputCandidates[i].currencyCode);
          inputAmountBNs.push(inputAmountBN);
          allOrders.push([]);
          allSignatures.push([]);
          makerAssetFillAmountBNs.push(0);
          protocolFeeBNs.push(0);

          amountInputtedUsdBN.iadd(inputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals)));
          amountWithdrawnBN.iadd(outputAmountBN);

          inputCandidates[i].rawFundBalanceBN.isub(inputAmountBN);
          if (inputCandidates[i].rawFundBalanceBN.isZero()) inputCandidates = inputCandidates.splice(i, 1);

          // Stop if we have filled the withdrawal
          if (amountWithdrawnBN.gte(amountBN)) break;
        }

        // Use 0x if necessary
        if (amountWithdrawnBN.lt(amountBN)) {
          // Get orders from 0x swap API for each input currency candidate
          for (var i = 0; i < inputCandidates.length; i++) {
            try {
              var [orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice] = await App.get0xSwapOrders(App.tokens[inputCandidates[i].currencyCode].address, token === "ETH" ? "WETH" : App.tokens[token].address, inputCandidates[i].rawFundBalanceBN, amountBN.sub(amountWithdrawnBN));
            } catch (err) {
              return toastr["error"]("Failed to get swap orders from 0x API: " + err, "Withdrawal failed");
            }

            // Build array of orders and signatures
            var signatures = [];

            for (var j = 0; j < orders.length; j++) {
              signatures[j] = orders[j].signature;
              
              orders[j] = {
                makerAddress: orders[j].makerAddress,
                takerAddress: orders[j].takerAddress,
                feeRecipientAddress: orders[j].feeRecipientAddress,
                senderAddress: orders[j].senderAddress,
                makerAssetAmount: orders[j].makerAssetAmount,
                takerAssetAmount: orders[j].takerAssetAmount,
                makerFee: orders[j].makerFee,
                takerFee: orders[j].takerFee,
                expirationTimeSeconds: orders[j].expirationTimeSeconds,
                salt: orders[j].salt,
                makerAssetData: orders[j].makerAssetData,
                takerAssetData: orders[j].takerAssetData,
                makerFeeAssetData: orders[j].makerFeeAssetData,
                takerFeeAssetData: orders[j].takerFeeAssetData
              };
            }

            inputCandidates[i].orders = orders;
            inputCandidates[i].signatures = signatures;
            inputCandidates[i].inputFillAmountBN = inputFilledAmountBN;
            inputCandidates[i].protocolFee = protocolFee;
            inputCandidates[i].takerAssetFillAmountBN = takerAssetFilledAmountBN;
            inputCandidates[i].makerAssetFillAmountBN = makerAssetFilledAmountBN;
          }

          // Sort candidates from lowest to highest takerAssetFillAmount
          inputCandidates.sort((a, b) => a.makerAssetFillAmountBN.gt(b.makerAssetFillAmountBN) ? 1 : -1);

          // Loop through input currency candidates until we fill the withdrawal
          for (var i = 0; i < inputCandidates.length; i++) {
            // If there is enough input in the fund and enough 0x orders to fulfill the rest of the withdrawal amount, withdraw and exchange
            if (inputCandidates[i].makerAssetFillAmountBN.gte(amountBN.sub(amountWithdrawnBN))) {
              var thisOutputAmountBN = amountBN.sub(amountWithdrawnBN);
              var thisInputAmountBN = inputCandidates[i].inputFillAmountBN.mul(thisOutputAmountBN).div(inputCandidates[i].makerAssetFillAmountBN);
              
              var tries = 0;
              while (inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).lt(thisOutputAmountBN)) {
                if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount", "Withdrawal failed");
                thisInputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount
                tries++;
              }

              inputCurrencyCodes.push(inputCandidates[i].currencyCode);
              inputAmountBNs.push(thisInputAmountBN);
              allOrders.push(inputCandidates[i].orders);
              allSignatures.push(inputCandidates[i].signatures);
              makerAssetFillAmountBNs.push(thisOutputAmountBN);
              protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));

              amountInputtedUsdBN.iadd(thisInputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals)));
              amountWithdrawnBN.iadd(thisOutputAmountBN);
              totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));

              break;
            }

            // Add all that we can of the last one, then go through them again
            if (i == inputCandidates.length - 1) {
              inputCurrencyCodes.push(inputCandidates[i].currencyCode);
              inputAmountBNs.push(inputCandidates[i].inputFillAmountBN);
              allOrders.push(inputCandidates[i].orders);
              allSignatures.push(inputCandidates[i].signatures);
              makerAssetFillAmountBNs.push(inputCandidates[i].makerAssetFillAmountBN);
              protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));

              amountInputtedUsdBN.iadd(inputCandidates[i].inputFillAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(10 ** App.tokens[inputCandidates[i].currencyCode].decimals)));
              amountWithdrawnBN.iadd(inputCandidates[i].makerAssetFillAmountBN);
              totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));

              i = -1;
              inputCandidates.pop();
            }

            // Stop if we have filled the withdrawal
            if (amountWithdrawnBN.gte(amountBN)) break;
          }
        
          // Make sure input amount is completely filled
          if (amountWithdrawnBN.lt(amountBN)) {
            $('#WithdrawAmount').val(amountWithdrawnBN.toString() / (10 ** (token == "ETH" ? 18 : App.tokens[token].decimals)));
            return toastr["warning"]("Unable to find enough liquidity to exchange withdrawn tokens to " + token + ".", "Withdrawal canceled");
          }
        }

        // Warn user of slippage
        var epochNow = (new Date()).getTime();

        if (!App.zeroExPrices["DAI"] || epochNow > App.zeroExPrices["DAI"]._lastUpdated + (60 * 1000)) {
          try {
            App.zeroExPrices["DAI"] = await App.get0xPrices("DAI");
            App.zeroExPrices["DAI"]._lastUpdated = epochNow;
          } catch (err) {
            return toastr["error"]("Failed to get prices from 0x swap API: " + err, "Withdrawal failed");
          }
        }

        if (App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]) var amountOutputtedUsd = amount * App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]; // TODO: Use actual input currencies instead of using DAI for USD price
        else if (["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0) var amountOutputtedUsd = amount;
        else return toastr["error"]("Price not found on 0x swap API", "Withdrawal failed");

        var slippage = 1 - (amountOutputtedUsd / (amountInputtedUsdBN.toString() / 1e18));
        var slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

        if (!$('#modal-confirm-withdrawal').is(':visible')) {
          $('#WithdrawExchangeFee kbd').html((totalProtocolFeeBN.toString() / 1e18) + ' ETH <small>($' + (totalProtocolFeeBN.toString() / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
          $('#WithdrawExchangeFee').show();
          totalProtocolFeeBN.gt(Web3.utils.toBN(0)) ? $('#WithdrawZeroExGasPriceWarning').attr("style", "display: block !important;") : $('#WithdrawZeroExGasPriceWarning').attr("style", "display: none !important;");
          $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
          return $('#modal-confirm-withdrawal').modal('show');
        }

        if ($('#WithdrawSlippage kbd').text() !== slippageAbsPercentageString + "%") {
          $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
          return toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to make your withdrawal.", "Please try again");
        }

        if ($('#WithdrawExchangeFee kbd').html().substring(0, $('#WithdrawExchangeFee kbd').html().indexOf("<") - 1) !== (totalProtocolFeeBN.toString() / 1e18) + " ETH") {
          $('#WithdrawExchangeFee kbd').html((totalProtocolFeeBN.toString() / 1e18) + ' ETH <small>($' + (totalProtocolFeeBN.toString() / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
          totalProtocolFeeBN.gt(Web3.utils.toBN(0)) ? $('#WithdrawZeroExGasPriceWarning').attr("style", "display: block !important;") : $('#WithdrawZeroExGasPriceWarning').attr("style", "display: none !important;");
          return toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to make your withdrawal.", "Please try again");
        }

        console.log('Withdraw and exchange to ' + (amountWithdrawnBN.toString() / (10 ** (token == "ETH" ? 18 : App.tokens[token].decimals))) + ' ' + token);

        // Withdraw and exchange tokens via RariFundProxy
        try {
          var inputAmountStrings = [];
          for (var i = 0; i < inputAmountBNs.length; i++) inputAmountStrings[i] = inputAmountBNs[i].toString();
          var makerAssetFillAmountStrings = [];
          for (var i = 0; i < makerAssetFillAmountBNs.length; i++) makerAssetFillAmountStrings[i] = makerAssetFillAmountBNs[i].toString();
          var protocolFeeStrings = [];
          for (var i = 0; i < protocolFeeBNs.length; i++) protocolFeeStrings[i] = protocolFeeBNs[i].toString();
          console.log("RariFundProxy.withdrawAndExchange parameters:", inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
          var receipt = await App.contracts.RariFundProxy.methods.withdrawAndExchange(inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings).send({ from: App.selectedAccount, value: totalProtocolFeeBN, gasPrice: gasPrice, nonce: await App.web3.eth.getTransactionCount(App.selectedAccount) });
        } catch (err) {
          return toastr["error"]("RariFundProxy.withdrawAndExchange failed: " + (err.message ? err.message : err), "Withdrawal failed");
        }

        // Mixpanel
        if (typeof mixpanel !== 'undefined') {
          var inputs = [];
          for (var i = 0; i < inputCurrencyCodes.length; i++) inputs.push({ currencyCode: inputCurrencyCodes[i], amount: inputAmountBNs[i].toString() / (10 ** App.tokens[inputCurrencyCodes[i]].decimals) });
          mixpanel.track("Withdraw and exchange", { transactionHash: receipt.transactionHash, inputs, outputCurrencyCode: token, outputAmount: amount });
        }

        // Hide old slippage after exchange success
        $('#modal-confirm-withdrawal').modal('hide');
      }
      
      // Alert success and refresh balances
      toastr["success"]("Withdrawal of " + amount + " " + token + " confirmed!", "Withdrawal successful");
      $('#USDBalance').text("?");
      App.getFundBalance();
      $('#MyUSDBalance').text("?");
      App.getMyFundBalance();
      $('#RSFTBalance').text("?");
      App.getTokenBalance();
      App.getDirectlyWithdrawableCurrencies();
    })();

    $('#withdrawButton').text("Withdraw");
    $('#confirmWithdrawalButton').text("Confirm");
    $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", false);
  },

  /**
   * Get the total balance of the stablecoin fund in USD.
   */
  getFundBalance: function() {
    console.log('Getting fund balance...');

    App.contracts.RariFundManager.methods.getFundBalance().call().then(function(result) {
      $('#USDBalance').text((new Big(result)).div((new Big(10)).pow(18)).toFormat(4));
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get the user's account balance in the stablecoin fund in USD.
   */
  getMyFundBalance: function() {
    console.log('Getting my fund balance...');

    App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call().then(function(result) {
      $('#MyUSDBalance').text((new Big(result)).div((new Big(10)).pow(18)).toFormat());
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get the user's interest accrued in the stablecoin fund in USD.
   */
  /* getMyInterestAccrued: function() {
    console.log('Getting my interest accrued...');

    App.contracts.RariFundManager.methods.interestAccruedBy(App.selectedAccount).call().then(function(result) {
      $('#MyInterestAccrued').text((new Big(result)).div((new Big(10)).pow(18)).toFormat());
    }).catch(function(err) {
      console.error(err);
    });
  }, */

  /**
   * Transfer RariFundToken.
   */
  handleTransfer: async function(event) {
    event.preventDefault();

    var currency = $('#TransferCurrency').val();
    if (["USD", "RSFT"].indexOf(currency) < 0) return toastr["error"]("Invalid currency!", "Transfer failed");
    var amount = parseFloat($('#TransferAmount').val());
    if (!amount || amount <= 0) return toastr["error"]("Transfer amount must be greater than 0!", "Transfer failed");
    var amountBN = Web3.utils.toBN((new Big(amount)).mul((new Big(10)).pow(18)).toFixed());
    var toAddress = $('#TransferAddress').val();
    if (!toAddress) return toastr["error"]("You must enter a destination address!", "Transfer failed");

    $('#transferButton').prop("disabled", true);
    $('#transferButton').html('<div class="loading-icon"><div></div><div></div><div></div></div>');

    await (async function() {
      console.log('Transfer ' + amount + ' ' + currency + ' to ' + toAddress);

      if (currency === "USD") {
        var fundBalanceBN = Web3.utils.toBN(await App.contracts.RariFundManager.methods.getFundBalance().call());
        var rftTotalSupplyBN = Web3.utils.toBN(await App.contracts.RariFundToken.methods.totalSupply().call());
        var rftAmountBN = amountBN.mul(rftTotalSupplyBN).div(fundBalanceBN);
      } else var rftAmountBN = amountBN;

      try {
        var receipt = await App.contracts.RariFundToken.methods.transfer(toAddress, rftAmountBN).send({ from: App.selectedAccount });
      } catch (err) {
        return toastr["error"](err, "Transfer failed");
      }

      if (typeof mixpanel !== 'undefined') mixpanel.track("RSFT transfer", { transactionHash: receipt.transactionHash, currencyCode: currency, amount });
      toastr["success"]("Transfer of " + (currency === "USD" ? "$" : "") + amount + " " + currency + " confirmed!", "Transfer successful");
      $('#RSFTBalance').text("?");
      App.getTokenBalance();
      $('#MyUSDBalance').text("?");
      App.getMyFundBalance();
    })();

    $('#transferButton').text("Transfer");
    $('#transferButton').prop("disabled", false);
  },

  /**
   * Get's the user's balance of RariFundToken.
   */
  getTokenBalance: function() {
    console.log('Getting token balance...');

    App.contracts.RariFundToken.methods.balanceOf(App.selectedAccount).call().then(function(result) {
      $('#RSFTBalance').text((new Big(result)).div((new Big(10)).pow(18)).toFormat());
    }).catch(function(err) {
      console.error(err);
    });
  }

};

$(function() {
  $(document).ready(function() {
    App.init();
  });
});

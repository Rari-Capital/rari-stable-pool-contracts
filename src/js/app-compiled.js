function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Unpackage imports
var Web3Modal = window.Web3Modal.default;
var WalletConnectProvider = window.WalletConnectProvider.default;
var EvmChains = window.EvmChains;
var Fortmatic = window.Fortmatic;
var Torus = window.Torus;
var Portis = window.Portis;
var Authereum = window.Authereum; // Enable Big.toFormat

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
    "DAI": {
      decimals: 18,
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    "USDC": {
      decimals: 6,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "USDT": {
      decimals: 6,
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    "TUSD": {
      decimals: 18,
      address: "0x0000000000085d4780B73119b644AE5ecd22b376"
    },
    "BUSD": {
      decimals: 18,
      address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53"
    },
    "sUSD": {
      decimals: 18,
      address: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51"
    },
    "mUSD": {
      decimals: 18,
      address: "0xe2f2a5C287993345a840Db3B0845fbC70f5935a5"
    }
  },
  erc20Abi: null,
  zeroExPrices: {},
  usdPrices: {},
  usdPricesLastUpdated: 0,
  checkAccountBalanceLimit: true,
  acceptedCurrencies: [],
  supportedCurrencies: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"],
  chainlinkPricesInUsd: {},
  init: function init() {
    if (location.hash === "#account") {
      $('#page-fund').hide();
      $('#page-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    }

    $('#tab-fund').click(function () {
      $('#page-account').hide();
      $('#page-fund').show();
      $('#tab-account').css('text-decoration', '');
      $('#tab-fund').css('text-decoration', 'underline');
    });
    $('#tab-account').click(function () {
      $('#page-fund').hide();
      $('#page-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    }); // Bypass account balance limit checking (client-side only)

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
  initChartColors: function initChartColors() {
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
  getCurrentApy: function () {
    var _getCurrentApy = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var factors, totalBalanceUsdBN, dydxApyBNs, compoundApyBNs, aaveApyBNs, mstableApyBNs, allBalances, i, currencyCode, priceInUsdBN, contractBalanceBN, contractBalanceUsdBN, pools, poolBalances, j, pool, poolBalanceBN, poolBalanceUsdBN, apyBN, maxApyBN;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              factors = [];
              totalBalanceUsdBN = Web3.utils.toBN(0);
              _context.next = 4;
              return App.getDydxApyBNs();

            case 4:
              dydxApyBNs = _context.sent;
              _context.next = 7;
              return App.getCompoundApyBNs();

            case 7:
              compoundApyBNs = _context.sent;
              _context.next = 10;
              return App.getAaveApyBNs();

            case 10:
              aaveApyBNs = _context.sent;
              _context.next = 13;
              return App.getMStableApyBNs();

            case 13:
              mstableApyBNs = _context.sent;
              App.allocationsByPool = {
                0: Web3.utils.toBN(0),
                1: Web3.utils.toBN(0),
                2: Web3.utils.toBN(0),
                3: Web3.utils.toBN(0)
              };
              App.allocationsByCurrency = {
                "DAI": Web3.utils.toBN(0),
                "USDC": Web3.utils.toBN(0),
                "USDT": Web3.utils.toBN(0),
                "TUSD": Web3.utils.toBN(0),
                "BUSD": Web3.utils.toBN(0),
                "sUSD": Web3.utils.toBN(0),
                "mUSD": Web3.utils.toBN(0)
              };
              _context.next = 18;
              return App.contracts.RariFundProxy.methods.getRawFundBalancesAndPrices().call();

            case 18:
              allBalances = _context.sent;

              for (i = 0; i < allBalances["0"].length; i++) {
                currencyCode = allBalances["0"][i];
                priceInUsdBN = Web3.utils.toBN(allBalances["4"][i]);
                App.chainlinkPricesInUsd[currencyCode] = priceInUsdBN;
                contractBalanceBN = Web3.utils.toBN(allBalances["1"][i]);
                contractBalanceUsdBN = contractBalanceBN.mul(priceInUsdBN).div(Web3.utils.toBN(Math.pow(10, App.tokens[currencyCode].decimals))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

                factors.push([contractBalanceUsdBN, Web3.utils.toBN(0)]);
                totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN);
                App.allocationsByCurrency[currencyCode] = contractBalanceUsdBN;
                pools = allBalances["2"][i];
                poolBalances = allBalances["3"][i];

                for (j = 0; j < pools.length; j++) {
                  pool = pools[j];
                  poolBalanceBN = Web3.utils.toBN(poolBalances[j]);
                  poolBalanceUsdBN = poolBalanceBN.mul(priceInUsdBN).div(Web3.utils.toBN(Math.pow(10, App.tokens[currencyCode].decimals))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

                  apyBN = pool == 3 ? mstableApyBNs[currencyCode] : pool == 2 ? aaveApyBNs[currencyCode] : pool == 1 ? compoundApyBNs[currencyCode][0].add(compoundApyBNs[currencyCode][1]) : dydxApyBNs[currencyCode];
                  factors.push([poolBalanceUsdBN, apyBN]);
                  totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN);
                  App.allocationsByCurrency[currencyCode].iadd(poolBalanceUsdBN);
                  App.allocationsByPool[pool].iadd(poolBalanceUsdBN);
                }
              }

              if (!totalBalanceUsdBN.isZero()) {
                _context.next = 24;
                break;
              }

              maxApyBN = Web3.utils.toBN(0);

              for (i = 0; i < factors.length; i++) {
                if (factors[i][1].gt(maxApyBN)) maxApyBN = factors[i][1];
              }

              return _context.abrupt("return", $('#APYNow').text((parseFloat(maxApyBN.toString()) / 1e16).toFixed(2) + "%"));

            case 24:
              apyBN = Web3.utils.toBN(0);

              for (i = 0; i < factors.length; i++) {
                apyBN.iadd(factors[i][0].mul(factors[i][1]).div(totalBalanceUsdBN));
              }

              $('#APYNow').text((parseFloat(apyBN.toString()) / 1e16).toFixed(2) + "%");
              App.initCurrencyAllocationChart();
              App.initPoolAllocationChart();

            case 29:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function getCurrentApy() {
      return _getCurrentApy.apply(this, arguments);
    }

    return getCurrentApy;
  }(),
  initCurrencyAllocationChart: function initCurrencyAllocationChart() {
    var ctx = document.getElementById('chart-currencies').getContext('2d');
    var color = Chart.helpers.color;
    var cfg = {
      type: 'pie',
      data: {
        datasets: [{
          data: [App.allocationsByCurrency["DAI"].toString() / 1e18, App.allocationsByCurrency["USDC"].toString() / 1e18, App.allocationsByCurrency["USDT"].toString() / 1e18, App.allocationsByCurrency["TUSD"].toString() / 1e18, App.allocationsByCurrency["BUSD"].toString() / 1e18, App.allocationsByCurrency["sUSD"].toString() / 1e18, App.allocationsByCurrency["mUSD"].toString() / 1e18],
          backgroundColor: [color(window.chartColors.red).alpha(0.5).rgbString(), color(window.chartColors.orange).alpha(0.5).rgbString(), color(window.chartColors.yellow).alpha(0.5).rgbString(), color(window.chartColors.green).alpha(0.5).rgbString(), color(window.chartColors.blue).alpha(0.5).rgbString(), color(window.chartColors.purple).alpha(0.5).rgbString(), color(window.chartColors.grey).alpha(0.5).rgbString()],
          borderColor: [window.chartColors.red, window.chartColors.orange, window.chartColors.yellow, window.chartColors.green, window.chartColors.blue, window.chartColors.purple, window.chartColors.gray]
        }],
        labels: ['DAI', 'USDC', 'USDT', 'TUSD', 'BUSD', 'sUSD', 'mUSD']
      },
      options: {
        tooltips: {
          callbacks: {
            label: function label(tooltipItem, myData) {
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
  initPoolAllocationChart: function initPoolAllocationChart() {
    var ctx = document.getElementById('chart-pools').getContext('2d');
    var color = Chart.helpers.color;
    var cfg = {
      type: 'pie',
      data: {
        datasets: [{
          data: [App.allocationsByPool[0].toString() / 1e18, App.allocationsByPool[1].toString() / 1e18, App.allocationsByPool[2].toString() / 1e18, App.allocationsByPool[3].toString() / 1e18],
          backgroundColor: [color(window.chartColors.blue).alpha(0.5).rgbString(), color(window.chartColors.red).alpha(0.5).rgbString(), color(window.chartColors.yellow).alpha(0.5).rgbString(), color(window.chartColors.purple).alpha(0.5).rgbString()],
          borderColor: [window.chartColors.blue, window.chartColors.red, window.chartColors.yellow, window.chartColors.purple]
        }],
        labels: ['dYdX', 'Compound', 'Aave', 'mStable']
      },
      options: {
        tooltips: {
          callbacks: {
            label: function label(tooltipItem, myData) {
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
  getDydxApyBNs: function () {
    var _getDydxApyBNs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var data, apyBNs, i;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return $.getJSON("https://api.dydx.exchange/v1/markets");

            case 2:
              data = _context2.sent;
              apyBNs = {};

              for (i = 0; i < data.markets.length; i++) {
                if (["DAI", "USDC", "USDT"].indexOf(data.markets[i].symbol) >= 0) apyBNs[data.markets[i].symbol] = Web3.utils.toBN(Math.trunc(parseFloat(data.markets[i].totalSupplyAPR) * 1e18));
              }

              return _context2.abrupt("return", apyBNs);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    function getDydxApyBNs() {
      return _getDydxApyBNs.apply(this, arguments);
    }

    return getDydxApyBNs;
  }(),
  getCompoundApyBNs: function () {
    var _getCompoundApyBNs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var data, apyBNs, i, supplyApy, compApy;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return $.getJSON("https://api.compound.finance/api/v2/ctoken");

            case 2:
              data = _context3.sent;
              apyBNs = {};
              i = 0;

            case 5:
              if (!(i < data.cToken.length)) {
                _context3.next = 20;
                break;
              }

              if (!(["DAI", "USDC", "USDT"].indexOf(data.cToken[i].underlying_symbol) >= 0)) {
                _context3.next = 17;
                break;
              }

              supplyApy = Web3.utils.toBN(Math.trunc(parseFloat(data.cToken[i].supply_rate.value) * 1e18));
              _context3.t0 = Web3.utils;
              _context3.t1 = Math;
              _context3.next = 12;
              return App.getApyFromComp(data.cToken[i].underlying_symbol, data.cToken);

            case 12:
              _context3.t2 = _context3.sent;
              _context3.t3 = _context3.t2 * 1e18;
              _context3.t4 = _context3.t1.trunc.call(_context3.t1, _context3.t3);
              compApy = _context3.t0.toBN.call(_context3.t0, _context3.t4);
              apyBNs[data.cToken[i].underlying_symbol] = [supplyApy, compApy];

            case 17:
              i++;
              _context3.next = 5;
              break;

            case 20:
              return _context3.abrupt("return", apyBNs);

            case 21:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    function getCompoundApyBNs() {
      return _getCompoundApyBNs.apply(this, arguments);
    }

    return getCompoundApyBNs;
  }(),
  getAaveApyBNs: function () {
    var _getAaveApyBNs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var data, apyBNs, i;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return $.ajax("https://api.thegraph.com/subgraphs/name/aave/protocol-multy-raw", {
                data: JSON.stringify({
                  query: "{\n      reserves(where: {\n        symbol_in: [\"DAI\", \"USDC\", \"USDT\", \"TUSD\", \"BUSD\", \"SUSD\"]\n      }) {\n        symbol\n        liquidityRate\n      }\n    }"
                }),
                contentType: 'application/json',
                type: 'POST'
              });

            case 2:
              data = _context4.sent;
              apyBNs = {};

              for (i = 0; i < data.data.reserves.length; i++) {
                apyBNs[data.data.reserves[i].symbol == "SUSD" ? "sUSD" : data.data.reserves[i].symbol] = Web3.utils.toBN(data.data.reserves[i].liquidityRate).div(Web3.utils.toBN(1e9));
              }

              return _context4.abrupt("return", apyBNs);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    function getAaveApyBNs() {
      return _getAaveApyBNs.apply(this, arguments);
    }

    return getAaveApyBNs;
  }(),
  // Based on calculateApy at https://github.com/mstable/mStable-app/blob/v1.8.1/src/web3/hooks.ts#L84
  calculateMStableApyBN: function calculateMStableApyBN(startTimestamp, startExchangeRate, endTimestamp, endExchangeRate) {
    var SCALE = new Big(1e18);
    var YEAR_BN = new Big(365 * 24 * 60 * 60);
    var rateDiff = new Big(endExchangeRate).mul(SCALE).div(startExchangeRate).sub(SCALE);
    var timeDiff = new Big(endTimestamp - startTimestamp);
    var portionOfYear = timeDiff.mul(SCALE).div(YEAR_BN);
    var portionsInYear = SCALE.div(portionOfYear);
    var rateDecimals = SCALE.add(rateDiff).div(SCALE);

    if (rateDecimals.gt(0)) {
      var diff = rateDecimals.pow(parseFloat(portionsInYear.toString()));
      var parsed = diff.mul(SCALE);
      return Web3.utils.toBN(parsed.sub(SCALE).toFixed(0)) || Web3.utils.toBN(0);
    }

    return Web3.utils.toBN(0);
  },
  getMStableApyBN: function () {
    var _getMStableApyBN = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
      var epochNow, epoch24HrsAgo, data;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              // TODO: Get exchange rates from contracts instead of The Graph
              // TODO: Use instantaneous APY instead of 24-hour APY?
              // Calculate APY with calculateApy using exchange rates from The Graph
              epochNow = Math.floor(new Date().getTime() / 1000);
              epoch24HrsAgo = epochNow - 86400;
              _context5.next = 4;
              return $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", {
                data: JSON.stringify({
                  "operationName": "ExchangeRates",
                  "variables": {
                    "day0": epoch24HrsAgo,
                    "day1": epochNow
                  },
                  "query": "query ExchangeRates($day0: Int!, $day1: Int!) {\n  day0: exchangeRates(where: {timestamp_lt: $day0}, orderDirection: desc, orderBy: timestamp, first: 1) {\n    ...ER\n    __typename\n  }\n  day1: exchangeRates(where: {timestamp_lt: $day1}, orderDirection: desc, orderBy: timestamp, first: 1) {\n    ...ER\n    __typename\n  }\n}\n\nfragment ER on ExchangeRate {\n  exchangeRate\n  timestamp\n  __typename\n}\n"
                }),
                contentType: 'application/json',
                type: 'POST'
              });

            case 4:
              data = _context5.sent;

              if (!(!data || !data.data)) {
                _context5.next = 7;
                break;
              }

              return _context5.abrupt("return", console.error("Failed to decode exchange rates from The Graph when calculating mStable 24-hour APY"));

            case 7:
              return _context5.abrupt("return", App.calculateMStableApyBN(epoch24HrsAgo, data.data.day0[0].exchangeRate, epochNow, data.data.day1[0].exchangeRate));

            case 8:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));

    function getMStableApyBN() {
      return _getMStableApyBN.apply(this, arguments);
    }

    return getMStableApyBN;
  }(),
  getMStableApyBNs: function () {
    var _getMStableApyBNs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return App.getMStableApyBN();

            case 2:
              _context6.t0 = _context6.sent;
              return _context6.abrupt("return", {
                "mUSD": _context6.t0
              });

            case 4:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6);
    }));

    function getMStableApyBNs() {
      return _getMStableApyBNs.apply(this, arguments);
    }

    return getMStableApyBNs;
  }(),
  getCurrencyUsdRates: function getCurrencyUsdRates(currencyCodes) {
    return new Promise(function (resolve, reject) {
      $.getJSON('https://api.coingecko.com/api/v3/coins/list', function (decoded) {
        if (!decoded) return reject("Failed to decode coins list from CoinGecko");
        var currencyCodesByCoinGeckoIds = {};

        var _iterator = _createForOfIteratorHelper(currencyCodes),
            _step;

        try {
          var _loop = function _loop() {
            var currencyCode = _step.value;
            if (currencyCode === "COMP") currencyCodesByCoinGeckoIds["compound-governance-token"] = "COMP";else if (currencyCode === "REP") currencyCodesByCoinGeckoIds["augur"] = "REP";else currencyCodesByCoinGeckoIds[decoded.find(function (coin) {
              return coin.symbol.toLowerCase() === currencyCode.toLowerCase();
            }).id] = currencyCode;
          };

          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            _loop();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        $.getJSON('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' + Object.keys(currencyCodesByCoinGeckoIds).join('%2C'), function (decoded) {
          if (!decoded) return reject("Failed to decode USD exchange rates from CoinGecko");
          var prices = {};

          for (var _i = 0, _Object$keys = Object.keys(decoded); _i < _Object$keys.length; _i++) {
            var key = _Object$keys[_i];
            prices[currencyCodesByCoinGeckoIds[key]] = ["DAI", "USDC", "USDT", "SAI"].indexOf(currencyCodesByCoinGeckoIds[key]) >= 0 ? 1.0 : decoded[key].usd;
          }

          resolve(prices);
        }).fail(function (err) {
          reject("Error requesting currency rates from CoinGecko: " + err.message);
        });
      }).fail(function (err) {
        reject("Error requesting currency rates from CoinGecko: " + err.message);
      });
    });
  },
  getApyFromComp: function () {
    var _getApyFromComp = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(currencyCode, cTokens) {
      var currencyCodes, priceMissing, _iterator2, _step2, cToken, now, currencyUnderlyingSupply, currencyBorrowUsd, totalBorrowUsd, _iterator3, _step3, _cToken, underlyingBorrow, borrowUsd, compPerBlock, marketCompPerBlock, marketSupplierCompPerBlock, marketSupplierCompPerBlockPerUsd, marketSupplierUsdFromCompPerBlockPerUsd;

      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              // Get cToken USD prices
              currencyCodes = ["COMP"];
              priceMissing = false;
              _iterator2 = _createForOfIteratorHelper(cTokens);

              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  cToken = _step2.value;
                  currencyCodes.push(cToken.underlying_symbol);
                  if (!App.usdPrices[cToken.underlying_symbol]) priceMissing = true;
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }

              now = new Date().getTime() / 1000;

              if (!(now > App.usdPricesLastUpdated + 900 || priceMissing)) {
                _context7.next = 10;
                break;
              }

              _context7.next = 8;
              return App.getCurrencyUsdRates(currencyCodes);

            case 8:
              App.usdPrices = _context7.sent;
              // TODO: Get real USD prices, not DAI prices
              App.usdPricesLastUpdated = now;

            case 10:
              // Get currency APY and total yearly interest
              currencyUnderlyingSupply = 0;
              currencyBorrowUsd = 0;
              totalBorrowUsd = 0;
              _iterator3 = _createForOfIteratorHelper(cTokens);

              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                  _cToken = _step3.value;
                  underlyingBorrow = _cToken.total_borrows.value * _cToken.exchange_rate.value;
                  borrowUsd = underlyingBorrow * App.usdPrices[_cToken.underlying_symbol];

                  if (_cToken.underlying_symbol === currencyCode) {
                    currencyUnderlyingSupply = _cToken.total_supply.value * _cToken.exchange_rate.value;
                    currencyBorrowUsd = borrowUsd;
                  }

                  totalBorrowUsd += borrowUsd;
                } // Get APY from COMP per block for this currency

              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
              }

              compPerBlock = 0.5;
              marketCompPerBlock = compPerBlock * (currencyBorrowUsd / totalBorrowUsd);
              marketSupplierCompPerBlock = marketCompPerBlock / 2;
              marketSupplierCompPerBlockPerUsd = marketSupplierCompPerBlock / currencyUnderlyingSupply; // Assumes that the value of currencyCode is $1

              marketSupplierUsdFromCompPerBlockPerUsd = marketSupplierCompPerBlockPerUsd * App.usdPrices["COMP"];
              return _context7.abrupt("return", marketSupplierUsdFromCompPerBlockPerUsd * 2102400);

            case 21:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));

    function getApyFromComp(_x, _x2) {
      return _getApyFromComp.apply(this, arguments);
    }

    return getApyFromComp;
  }(),
  initAprChart: function initAprChart() {
    var epochToday = Math.floor(new Date().getTime() / 1000 / 86400) * 86400;
    var mStableEpochs = [Math.floor(new Date().getTime() / 1000)];

    for (var i = 1; i < 365; i++) {
      mStableEpochs.push(mStableEpochs[0] - 86400 * i);
    }

    var mStableSubgraphVariables = {};

    for (var i = 0; i < 365; i++) {
      mStableSubgraphVariables["day" + i] = mStableEpochs[364 - i];
    }

    var mStableSubgraphArgs = [];
    var mStableSubgraphReturns = "";

    for (var i = 0; i < 365; i++) {
      mStableSubgraphArgs.push("$day" + i + ": Int!");
      mStableSubgraphReturns += "day" + i + ": exchangeRates(where: {timestamp_lt: $day" + i + "}, orderDirection: desc, orderBy: timestamp, first: 1) {\n        ...ER\n        __typename\n      }";
    }

    Promise.all([$.getJSON("https://app.rari.capital/dydx-aprs.json?v=" + epochToday), $.getJSON("https://app.rari.capital/compound-aprs.json?v=" + epochToday), $.getJSON("https://app.rari.capital/aave-aprs.json?v=" + epochToday), $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", {
      data: JSON.stringify({
        "operationName": "ExchangeRates",
        "variables": mStableSubgraphVariables,
        "query": "query ExchangeRates(" + mStableSubgraphArgs.join(", ") + ") {" + mStableSubgraphReturns + "}\nfragment ER on ExchangeRate {\n  exchangeRate\n  timestamp\n  __typename\n}"
      }),
      contentType: 'application/json',
      type: 'POST'
    })]).then(function (values) {
      var ourData = {};
      var dydxAvgs = [];
      var epochs = Object.keys(values[0]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (var _i2 = 0, _Object$keys2 = Object.keys(values[0][epochs[i]]); _i2 < _Object$keys2.length; _i2++) {
          var currencyCode = _Object$keys2[_i2];
          sum += values[0][epochs[i]][currencyCode];
          if (values[0][epochs[i]][currencyCode] > max) max = values[0][epochs[i]][currencyCode];
        }

        dydxAvgs.push({
          t: new Date(parseInt(epochs[i])),
          y: sum / Object.keys(values[0][epochs[i]]).length * 100
        }); // Add data for Rari graph

        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        ourData[flooredEpoch] = max;
      }

      var compoundAvgs = [];
      var epochs = Object.keys(values[1]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for Compound graph and max with COMP for our graph
        var sum = 0;
        var maxWithComp = 0;

        for (var _i3 = 0, _Object$keys3 = Object.keys(values[1][epochs[i]]); _i3 < _Object$keys3.length; _i3++) {
          var _currencyCode = _Object$keys3[_i3];
          sum += values[1][epochs[i]][_currencyCode][0];
          var apyWithComp = values[1][epochs[i]][_currencyCode][0] + values[1][epochs[i]][_currencyCode][1];
          if (apyWithComp > maxWithComp) maxWithComp = apyWithComp;
        }

        var avg = sum / Object.keys(values[1][epochs[i]]).length;
        compoundAvgs.push({
          t: new Date(parseInt(epochs[i])),
          y: avg * 100
        }); // Add data for Rari graph

        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || maxWithComp > ourData[flooredEpoch]) ourData[flooredEpoch] = maxWithComp;
      }

      var aaveAvgs = [];
      var epochs = Object.keys(values[2]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (var _i4 = 0, _Object$keys4 = Object.keys(values[2][epochs[i]]); _i4 < _Object$keys4.length; _i4++) {
          var _currencyCode2 = _Object$keys4[_i4];
          sum += values[2][epochs[i]][_currencyCode2];
          if (values[2][epochs[i]][_currencyCode2] > max) max = values[2][epochs[i]][_currencyCode2];
        }

        aaveAvgs.push({
          t: new Date(parseInt(epochs[i])),
          y: sum / Object.keys(values[2][epochs[i]]).length * 100
        }); // Add data for Rari graph

        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || max > ourData[flooredEpoch]) ourData[flooredEpoch] = max;
      }

      if (!values[3] || !values[3].data) return console.error("Failed to decode exchange rates from The Graph when calculating mStable 24-hour APY");
      var mStableAvgs = [];

      for (var i = 1; i < mStableEpochs.length; i++) {
        // mStable graph
        // 1590759420 == timestamp of launch Twitter annoucement: https://twitter.com/sassal0x/status/1266362912920137734
        var apy = values[3].data["day" + (i - 1)][0] && values[3].data["day" + i][0] && mStableEpochs[365 - i] >= 1590759420 ? App.calculateMStableApyBN(mStableEpochs[365 - i], values[3].data["day" + (i - 1)][0].exchangeRate, mStableEpochs[364 - i], values[3].data["day" + i][0].exchangeRate).toString() / 1e18 : 0;
        mStableAvgs.push({
          t: new Date(parseInt(mStableEpochs[364 - i]) * 1000),
          y: apy * 100
        }); // Add data for Rari graph

        var flooredEpoch = Math.floor(mStableEpochs[364 - i] / 86400) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || apy > ourData[flooredEpoch]) ourData[flooredEpoch] = apy;
      } // Turn Rari data into object for graph


      var ourAvgs = [];
      var epochs = Object.keys(ourData).sort();

      for (var i = 0; i < epochs.length; i++) {
        ourAvgs.push({
          t: new Date(parseInt(epochs[i])),
          y: ourData[epochs[i]] * 100
        });
      } // Display today's estimated APY
      // TODO: Display real APY


      $('#APYToday').text((ourData[epochs[epochs.length - 1]] * 100).toFixed(2) + "%"); // Init chart

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
              label: function label(tooltipItem, myData) {
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
      var chart = new Chart(ctx, cfg); // Convert APR chart data into return chart data

      var dydxReturns = [];
      var currentReturn = 10000;

      for (var i = 0; i < dydxAvgs.length; i++) {
        dydxReturns.push({
          t: dydxAvgs[i].t,
          y: currentReturn *= 1 + dydxAvgs[i].y / 100 / 365
        });
      }

      var compoundReturns = [];
      currentReturn = 10000;

      for (var i = 0; i < compoundAvgs.length; i++) {
        compoundReturns.push({
          t: compoundAvgs[i].t,
          y: currentReturn *= 1 + compoundAvgs[i].y / 100 / 365
        });
      }

      var aaveReturns = [];
      currentReturn = 10000;

      for (var i = 0; i < aaveAvgs.length; i++) {
        aaveReturns.push({
          t: aaveAvgs[i].t,
          y: currentReturn *= 1 + aaveAvgs[i].y / 100 / 365
        });
      }

      var mStableReturns = [];
      currentReturn = 10000;

      for (var i = 0; i < mStableAvgs.length; i++) {
        mStableReturns.push({
          t: mStableAvgs[i].t,
          y: currentReturn *= 1 + mStableAvgs[i].y / 100 / 365
        });
      }

      var ourReturns = [];
      currentReturn = 10000;

      for (var i = 0; i < ourAvgs.length; i++) {
        ourReturns.push({
          t: ourAvgs[i].t,
          y: currentReturn *= 1 + ourAvgs[i].y / 100 / 365
        });
      } // Init chart


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
              label: function label(tooltipItem, myData) {
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
  initWeb3Modal: function initWeb3Modal() {
    var providerOptions = {
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
      cacheProvider: false,
      // optional
      providerOptions: providerOptions // required

    });
  },

  /**
   * Kick in the UI action after Web3modal dialog has chosen a provider
   */
  fetchAccountData: function () {
    var _fetchAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
      var approveFunction, chainId, _i5, _Object$keys5, symbol, _i6, _Object$keys6, _symbol, i;

      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              // Get a Web3 instance for the wallet
              App.web3 = new Web3(App.web3Provider);

              approveFunction = /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(_ref) {
                  var from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress, response;
                  return regeneratorRuntime.wrap(function _callee8$(_context8) {
                    while (1) {
                      switch (_context8.prev = _context8.next) {
                        case 0:
                          from = _ref.from, to = _ref.to, encodedFunctionCall = _ref.encodedFunctionCall, txFee = _ref.txFee, gasPrice = _ref.gasPrice, gas = _ref.gas, nonce = _ref.nonce, relayerAddress = _ref.relayerAddress, relayHubAddress = _ref.relayHubAddress;
                          _context8.prev = 1;
                          _context8.next = 4;
                          return $.ajax('checkSig.php', {
                            data: JSON.stringify({
                              from: from,
                              to: to,
                              encodedFunctionCall: encodedFunctionCall,
                              txFee: txFee,
                              gasPrice: gasPrice,
                              gas: gas,
                              nonce: nonce,
                              relayerAddress: relayerAddress,
                              relayHubAddress: relayHubAddress
                            }),
                            contentType: 'application/json',
                            type: 'POST'
                          });

                        case 4:
                          response = _context8.sent;
                          _context8.next = 10;
                          break;

                        case 7:
                          _context8.prev = 7;
                          _context8.t0 = _context8["catch"](1);
                          return _context8.abrupt("return", console.error("checkSig error:", _context8.t0));

                        case 10:
                          console.log("checkSig response:", response);
                          return _context8.abrupt("return", response);

                        case 12:
                        case "end":
                          return _context8.stop();
                      }
                    }
                  }, _callee8, null, [[1, 7]]);
                }));

                return function approveFunction(_x3) {
                  return _ref2.apply(this, arguments);
                };
              }();

              App.web3Gsn = new Web3(new OpenZeppelinGSNProvider.GSNProvider(App.web3Provider, {
                approveFunction: approveFunction
              })); // Get connected chain ID from Ethereum node

              _context9.next = 5;
              return App.web3.eth.getChainId();

            case 5:
              chainId = _context9.sent;
              _context9.next = 8;
              return App.web3.eth.getAccounts();

            case 8:
              App.accounts = _context9.sent;
              App.selectedAccount = App.accounts[0]; // Mixpanel

              if (typeof mixpanel !== 'undefined') {
                mixpanel.identify(App.selectedAccount);
                mixpanel.people.set({
                  "Ethereum Address": App.selectedAccount,
                  "App Version": "1.2.0"
                });
              } // Refresh contracts to use new Web3


              for (_i5 = 0, _Object$keys5 = Object.keys(App.contracts); _i5 < _Object$keys5.length; _i5++) {
                symbol = _Object$keys5[_i5];
                App.contracts[symbol] = new App.web3.eth.Contract(App.contracts[symbol].options.jsonInterface, App.contracts[symbol].options.address);
              }

              App.contractsGsn.RariFundProxy = new App.web3Gsn.eth.Contract(App.contracts.RariFundProxy.options.jsonInterface, App.contracts.RariFundProxy.options.address);

              for (_i6 = 0, _Object$keys6 = Object.keys(App.tokens); _i6 < _Object$keys6.length; _i6++) {
                _symbol = _Object$keys6[_i6];
                if (App.tokens[_symbol].contract) App.tokens[_symbol].contract = new App.web3.eth.Contract(App.tokens[_symbol].contract.options.jsonInterface, App.tokens[_symbol].address);
              } // Get user's account balance in the stablecoin fund and RFT balance


              if (App.contracts.RariFundManager) {
                App.getMyFundBalance();
                if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
                /* App.getMyInterestAccrued();
                if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000); */
              }

              if (App.contracts.RariFundToken) {
                App.getTokenBalance();
                if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
              } // Load acounts dropdown


              $('#selected-account').empty();

              for (i = 0; i < App.accounts.length; i++) {
                $('#selected-account').append('<option' + (i == 0 ? ' selected' : '') + '>' + App.accounts[i] + '</option>');
              } // Display fully loaded UI for wallet data


              $('#depositButton, #withdrawButton, #transferButton').prop("disabled", false);

            case 19:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));

    function fetchAccountData() {
      return _fetchAccountData.apply(this, arguments);
    }

    return fetchAccountData;
  }(),

  /**
   * Fetch account data for UI when
   * - User switches accounts in wallet
   * - User switches networks in wallet
   * - User connects wallet initially
   */
  refreshAccountData: function () {
    var _refreshAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
      return regeneratorRuntime.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              // If any current data is displayed when
              // the user is switching acounts in the wallet
              // immediate hide this data
              $("#MyDAIBalance, #MyUSDCBalance, #MyUSDTBalance, #RSFTBalance").text("?"); // Disable button while UI is loading.
              // fetchAccountData() will take a while as it communicates
              // with Ethereum node via JSON-RPC and loads chain data
              // over an API call.

              $(".btn-connect").text("Loading...");
              $(".btn-connect").prop("disabled", true);
              _context10.next = 5;
              return App.fetchAccountData();

            case 5:
              $(".btn-connect").hide();
              $(".btn-connect").text("Connect Wallet");
              $(".btn-connect").prop("disabled", false);
              $("#btn-disconnect").show();
              $('.show-account').show();
              $('#page-fund').hide();
              $('#page-account').show();
              $('#tab-fund').css('text-decoration', '');
              $('#tab-account').css('text-decoration', 'underline');

            case 14:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10);
    }));

    function refreshAccountData() {
      return _refreshAccountData.apply(this, arguments);
    }

    return refreshAccountData;
  }(),

  /**
   * Connect wallet button pressed.
   */
  connectWallet: function () {
    var _connectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              // Setting this null forces to show the dialogue every time
              // regardless if we play around with a cacheProvider settings
              // in our localhost.
              // TODO: A clean API needed here
              App.web3Modal.providerController.cachedProvider = null;
              _context11.prev = 1;
              _context11.next = 4;
              return App.web3Modal.connect();

            case 4:
              App.web3Provider = _context11.sent;
              _context11.next = 11;
              break;

            case 7:
              _context11.prev = 7;
              _context11.t0 = _context11["catch"](1);
              console.error("Could not get a wallet connection", _context11.t0);
              return _context11.abrupt("return");

            case 11:
              if (App.web3Provider.on) {
                // Subscribe to accounts change
                App.web3Provider.on("accountsChanged", function (accounts) {
                  App.fetchAccountData();
                }); // Subscribe to chainId change

                App.web3Provider.on("chainChanged", function (chainId) {
                  App.fetchAccountData();
                }); // Subscribe to networkId change

                App.web3Provider.on("networkChanged", function (networkId) {
                  App.fetchAccountData();
                });
              }

              _context11.next = 14;
              return App.refreshAccountData();

            case 14:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11, null, [[1, 7]]);
    }));

    function connectWallet() {
      return _connectWallet.apply(this, arguments);
    }

    return connectWallet;
  }(),

  /**
   * Disconnect wallet button pressed.
   */
  disconnectWallet: function () {
    var _disconnectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
      return regeneratorRuntime.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              console.log("Killing the wallet connection", App.web3Provider); // TODO: MetamaskInpageProvider does not provide disconnect?

              if (!App.web3Provider.close) {
                _context12.next = 5;
                break;
              }

              _context12.next = 4;
              return App.web3Provider.close();

            case 4:
              App.web3Provider = null;

            case 5:
              App.selectedAccount = null; // Set the UI back to the initial state

              $("#selected-account").html('<option disabled selected>Please connect your wallet...</option>');
              $('.show-account').hide();
              $("#btn-disconnect").hide();
              $(".btn-connect").show();
              $('#MyUSDBalance').text("?");
              $('#RSFTBalance').text("?");
              $('#MyInterestAccrued').text("?");

            case 13:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12);
    }));

    function disconnectWallet() {
      return _disconnectWallet.apply(this, arguments);
    }

    return disconnectWallet;
  }(),

  /**
   * Initialize the latest version of web3.js (MetaMask uses an oudated one that overwrites ours if we include it as an HTML tag), then initialize and connect Web3Modal.
   */
  initWeb3: function initWeb3() {
    $.getScript("js/web3.min.js", function () {
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
  initContracts: function initContracts() {
    $.getJSON('abi/RariFundManager.json?v=1599624605', function (data) {
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
      setInterval(function () {
        App.getDirectlyDepositableCurrencies();
        App.getDirectlyWithdrawableCurrencies();
      }, 5 * 60 * 1000);
    });
    $.getJSON('abi/RariFundToken.json?v=1595276956', function (data) {
      App.contracts.RariFundToken = new App.web3.eth.Contract(data, "0x9366B7C00894c3555c7590b0384e5F6a9D55659f");

      if (App.selectedAccount) {
        App.getTokenBalance();
        if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
      }
    });
    $.getJSON('abi/RariFundProxy.json?v=1599624605', function (data) {
      App.contracts.RariFundProxy = new App.web3.eth.Contract(data, "0xeB185c51d5640Cf5555972EC8DdD9B1b901F5730");
      App.getCurrentApy();
      setInterval(App.getCurrentApy, 5 * 60 * 1000);
    });
    $.getJSON('abi/ERC20.json', function (data) {
      App.erc20Abi = data;

      for (var _i7 = 0, _Object$keys7 = Object.keys(App.tokens); _i7 < _Object$keys7.length; _i7++) {
        var symbol = _Object$keys7[_i7];
        App.tokens[symbol].contract = new App.web3.eth.Contract(data, App.tokens[symbol].address);
      }
    });
    $.getJSON('https://api.0x.org/swap/v0/tokens', function (data) {
      data.records.sort(function (a, b) {
        return a.symbol > b.symbol ? 1 : -1;
      });

      var _iterator4 = _createForOfIteratorHelper(data.records),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var token = _step4.value;
          if (App.tokens[token.symbol]) continue;
          App.tokens[token.symbol] = {
            address: token.address,
            decimals: token.decimals,
            contract: App.erc20Abi ? new App.web3.eth.Contract(App.erc20Abi, token.address) : null
          };
          $('#DepositToken').append('<option>' + token.symbol + '</option>');
          $('#WithdrawToken').append('<option>' + token.symbol + '</option>');
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    });
    $.getJSON('abi/MassetValidationHelper.json', function (data) {
      App.contracts.MassetValidationHelper = new App.web3.eth.Contract(data, "0xabcc93c3be238884cc3309c19afd128fafc16911");
    });
  },
  getDirectlyDepositableCurrencies: function () {
    var _getDirectlyDepositableCurrencies = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13() {
      var _i8, _arr, currencyCode;

      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              _context13.next = 2;
              return App.contracts.RariFundManager.methods.getAcceptedCurrencies().call();

            case 2:
              App.acceptedCurrencies = _context13.sent;

              for (_i8 = 0, _arr = ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"]; _i8 < _arr.length; _i8++) {
                currencyCode = _arr[_i8];
                $('#DepositToken > option[value="' + currencyCode + '"]').text(currencyCode + (App.acceptedCurrencies.indexOf(currencyCode) >= 0 ? " (no slippage)" : ""));
              }

            case 4:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13);
    }));

    function getDirectlyDepositableCurrencies() {
      return _getDirectlyDepositableCurrencies.apply(this, arguments);
    }

    return getDirectlyDepositableCurrencies;
  }(),
  getDirectlyWithdrawableCurrencies: function () {
    var _getDirectlyWithdrawableCurrencies = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14() {
      var _i9, _arr2, currencyCode, rawFundBalance;

      return regeneratorRuntime.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _i9 = 0, _arr2 = ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"];

            case 1:
              if (!(_i9 < _arr2.length)) {
                _context14.next = 10;
                break;
              }

              currencyCode = _arr2[_i9];
              _context14.next = 5;
              return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](currencyCode).call();

            case 5:
              rawFundBalance = _context14.sent;
              $('#WithdrawToken > option[value="' + currencyCode + '"]').text(currencyCode + (parseFloat(rawFundBalance) > 0 ? " (no slippage up to " + (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals) >= 10 ? (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals)).toFixed(2) : (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals)).toPrecision(4)) + ")" : ""));

            case 7:
              _i9++;
              _context14.next = 1;
              break;

            case 10:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14);
    }));

    function getDirectlyWithdrawableCurrencies() {
      return _getDirectlyWithdrawableCurrencies.apply(this, arguments);
    }

    return getDirectlyWithdrawableCurrencies;
  }(),

  /**
   * Bind button click events.
   */
  bindEvents: function bindEvents() {
    $(document).on('click', '.btn-connect', App.connectWallet);
    $(document).on('click', '#btn-disconnect', App.disconnectWallet);
    $(document).on('change', '#selected-account', function () {
      // Set selected account
      App.selectedAccount = $(this).val(); // Mixpanel

      if (typeof mixpanel !== 'undefined') {
        mixpanel.identify(App.selectedAccount);
        mixpanel.people.set({
          "Ethereum Address": App.selectedAccount,
          "App Version": "1.2.0"
        });
      } // Get user's account balance in the stablecoin fund and RFT balance


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
  get0xPrices: function get0xPrices(inputTokenSymbol) {
    return new Promise(function (resolve, reject) {
      $.getJSON('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, function (decoded) {
        if (!decoded) return reject("Failed to decode prices from 0x swap API");
        if (!decoded.records) return reject("No prices found on 0x swap API");
        var prices = {};

        for (var i = 0; i < decoded.records.length; i++) {
          prices[decoded.records[i].symbol] = decoded.records[i].price;
        }

        resolve(prices);
      }).fail(function (err) {
        reject("Error requesting prices from 0x swap API: " + err.message);
      });
    });
  },
  get0xSwapOrders: function get0xSwapOrders(inputTokenAddress, outputTokenAddress, maxInputAmountBN, maxMakerAssetFillAmountBN) {
    return new Promise(function (resolve, reject) {
      $.getJSON('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + (maxMakerAssetFillAmountBN !== undefined ? '&buyAmount=' + maxMakerAssetFillAmountBN.toString() : '&sellAmount=' + maxInputAmountBN.toString()), function (decoded) {
        if (!decoded) return reject("Failed to decode quote from 0x swap API");
        if (!decoded.orders) return reject("No orders found on 0x swap API");
        decoded.orders.sort(function (a, b) {
          return a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee) ? 1 : -1;
        });
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
            } // If this order input amount is higher than the remaining input, calculate orderTakerAssetFillAmountBN and orderMakerAssetFillAmountBN from the remaining maxInputAmountBN as usual


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
          } // Add order to returned array


          orders.push(decoded.orders[i]); // Add order fill amounts to total fill amounts

          inputFilledAmountBN.iadd(orderInputFillAmountBN);
          takerAssetFilledAmountBN.iadd(orderTakerAssetFillAmountBN);
          makerAssetFilledAmountBN.iadd(orderMakerAssetFillAmountBN); // Check if we have hit maxInputAmountBN or maxTakerAssetFillAmountBN

          if (inputFilledAmountBN.gte(maxInputAmountBN) || maxMakerAssetFillAmountBN !== undefined && makerAssetFilledAmountBN.gte(maxMakerAssetFillAmountBN)) break;
        }

        if (takerAssetFilledAmountBN.isZero()) return reject("No orders found on 0x swap API");
        resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, decoded.gasPrice]);
      }).fail(function (err) {
        reject("Error requesting quote from 0x swap API: " + err.message);
      });
    });
  },
  getMStableSwapFeeBN: function () {
    var _getMStableSwapFeeBN = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15() {
      var data;
      return regeneratorRuntime.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              _context15.next = 2;
              return $.ajax("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol", {
                data: JSON.stringify({
                  query: "{\n      massets(where: { id: \"0xe2f2a5c287993345a840db3b0845fbc70f5935a5\" }) {\n        feeRate\n      }\n    }"
                }),
                contentType: 'application/json',
                type: 'POST'
              });

            case 2:
              data = _context15.sent;
              return _context15.abrupt("return", Web3.utils.toBN(data.data.massets[0].feeRate));

            case 4:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15);
    }));

    function getMStableSwapFeeBN() {
      return _getMStableSwapFeeBN.apply(this, arguments);
    }

    return getMStableSwapFeeBN;
  }(),

  /**
   * Deposit funds to the stablecoin fund.
   */
  handleDeposit: function () {
    var _handleDeposit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(event) {
      var token, amount, amountBN, accountBalanceBN;
      return regeneratorRuntime.wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              event.preventDefault();
              token = $('#DepositToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context17.next = 4;
                break;
              }

              return _context17.abrupt("return", toastr["error"]("Invalid token!", "Deposit failed"));

            case 4:
              amount = parseFloat($('#DepositAmount').val());

              if (!(!amount || amount <= 0)) {
                _context17.next = 7;
                break;
              }

              return _context17.abrupt("return", toastr["error"]("Deposit amount must be greater than 0!", "Deposit failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              _context17.t0 = Web3.utils;
              _context17.next = 11;
              return token == "ETH" ? App.web3.eth.getBalance(App.selectedAccount) : App.tokens[token].contract.methods.balanceOf(App.selectedAccount).call();

            case 11:
              _context17.t1 = _context17.sent;
              accountBalanceBN = _context17.t0.toBN.call(_context17.t0, _context17.t1);

              if (!amountBN.gt(accountBalanceBN)) {
                _context17.next = 15;
                break;
              }

              return _context17.abrupt("return", toastr["error"]("Not enough balance in your account to make a deposit of this amount. Current account balance: " + new Big(accountBalanceBN.toString()).div(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toString() + " " + token, "Deposit failed"));

            case 15:
              $('#depositButton, #confirmDepositButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context17.next = 18;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16() {
                var myFundBalanceBN, depositContract, allowanceBN, receipt, mStableOutputCurrency, mStableOutputAmountAfterFeeBN, _iterator5, _step5, acceptedCurrency, redeemValidity, maxSwap, outputAmountUsdBN, epochNow, amountOutputted, slippage, slippageAbsPercentageString, _yield$App$get0xSwapO, _yield$App$get0xSwapO2, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, makerAssetFilledAmountUsdBN, signatures, j;

                return regeneratorRuntime.wrap(function _callee16$(_context16) {
                  while (1) {
                    switch (_context16.prev = _context16.next) {
                      case 0:
                        _context16.next = 2;
                        return App.getDirectlyDepositableCurrencies();

                      case 2:
                        if (App.acceptedCurrencies) {
                          _context16.next = 4;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("No accepted currencies found.", "Deposit failed"));

                      case 4:
                        if (!(App.acceptedCurrencies.indexOf(token) >= 0)) {
                          _context16.next = 41;
                          break;
                        }

                        if ($('#modal-confirm-deposit').is(':visible')) $('#modal-confirm-deposit').modal('hide');
                        _context16.t0 = Web3.utils;
                        _context16.next = 9;
                        return App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call();

                      case 9:
                        _context16.t1 = _context16.sent;
                        myFundBalanceBN = _context16.t0.toBN.call(_context16.t0, _context16.t1);

                        if (!(App.checkAccountBalanceLimit && myFundBalanceBN.add(amountBN.mul(App.chainlinkPricesInUsd[token]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[token].decimals)))).gt(Web3.utils.toBN(350e18)))) {
                          _context16.next = 13;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed"));

                      case 13:
                        console.log('Deposit ' + amount + ' ' + token + ' directly');
                        depositContract = amount >= 250 && myFundBalanceBN.isZero() ? App.contractsGsn.RariFundProxy : App.contracts.RariFundManager; // Approve tokens to RariFundManager

                        _context16.prev = 15;
                        _context16.t2 = Web3.utils;
                        _context16.next = 19;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, depositContract.options.address).call();

                      case 19:
                        _context16.t3 = _context16.sent;
                        allowanceBN = _context16.t2.toBN.call(_context16.t2, _context16.t3);

                        if (!allowanceBN.lt(amountBN)) {
                          _context16.next = 24;
                          break;
                        }

                        _context16.next = 24;
                        return App.tokens[token].contract.methods.approve(depositContract.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 24:
                        _context16.next = 29;
                        break;

                      case 26:
                        _context16.prev = 26;
                        _context16.t4 = _context16["catch"](15);
                        return _context16.abrupt("return", toastr["error"]("Failed to approve tokens: " + (_context16.t4.message ? _context16.t4.message : _context16.t4), "Deposit failed"));

                      case 29:
                        _context16.prev = 29;
                        _context16.next = 32;
                        return depositContract.methods.deposit(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 32:
                        receipt = _context16.sent;
                        _context16.next = 38;
                        break;

                      case 35:
                        _context16.prev = 35;
                        _context16.t5 = _context16["catch"](29);
                        return _context16.abrupt("return", toastr["error"](_context16.t5.message ? _context16.t5.message : _context16.t5, "Deposit failed"));

                      case 38:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct deposit", {
                          transactionHash: receipt.transactionHash,
                          currencyCode: token,
                          amount: amount
                        });
                        _context16.next = 254;
                        break;

                      case 41:
                        // Get mStable output currency if possible
                        mStableOutputCurrency = null;
                        mStableOutputAmountAfterFeeBN = null;

                        if (!(["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context16.next = 91;
                          break;
                        }

                        _iterator5 = _createForOfIteratorHelper(App.acceptedCurrencies);
                        _context16.prev = 45;

                        _iterator5.s();

                      case 47:
                        if ((_step5 = _iterator5.n()).done) {
                          _context16.next = 83;
                          break;
                        }

                        acceptedCurrency = _step5.value;

                        if (!(["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(acceptedCurrency) >= 0)) {
                          _context16.next = 81;
                          break;
                        }

                        if (!(token === "mUSD")) {
                          _context16.next = 66;
                          break;
                        }

                        _context16.prev = 51;
                        _context16.next = 54;
                        return App.contracts.MassetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", amountBN, App.tokens[acceptedCurrency].address).call();

                      case 54:
                        redeemValidity = _context16.sent;
                        _context16.next = 61;
                        break;

                      case 57:
                        _context16.prev = 57;
                        _context16.t6 = _context16["catch"](51);
                        console.error("Failed to check mUSD redeem validity:", _context16.t6);
                        return _context16.abrupt("continue", 81);

                      case 61:
                        if (!(!redeemValidity || !redeemValidity["0"])) {
                          _context16.next = 63;
                          break;
                        }

                        return _context16.abrupt("continue", 81);

                      case 63:
                        mStableOutputAmountAfterFeeBN = Web3.utils.toBN(redeemValidity["2"]);
                        _context16.next = 79;
                        break;

                      case 66:
                        _context16.prev = 66;
                        _context16.next = 69;
                        return App.contracts.MassetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", App.tokens[token].address, App.tokens[acceptedCurrency].address).call();

                      case 69:
                        maxSwap = _context16.sent;
                        _context16.next = 76;
                        break;

                      case 72:
                        _context16.prev = 72;
                        _context16.t7 = _context16["catch"](66);
                        console.error("Failed to check mUSD max swap:", _context16.t7);
                        return _context16.abrupt("continue", 81);

                      case 76:
                        if (!(!maxSwap || !maxSwap["0"] || amountBN.gt(Web3.utils.toBN(maxSwap["2"])))) {
                          _context16.next = 78;
                          break;
                        }

                        return _context16.abrupt("continue", 81);

                      case 78:
                        mStableOutputAmountAfterFeeBN = Web3.utils.toBN(maxSwap["3"]);

                      case 79:
                        mStableOutputCurrency = acceptedCurrency;
                        return _context16.abrupt("break", 83);

                      case 81:
                        _context16.next = 47;
                        break;

                      case 83:
                        _context16.next = 88;
                        break;

                      case 85:
                        _context16.prev = 85;
                        _context16.t8 = _context16["catch"](45);

                        _iterator5.e(_context16.t8);

                      case 88:
                        _context16.prev = 88;

                        _iterator5.f();

                        return _context16.finish(88);

                      case 91:
                        if (!(mStableOutputCurrency !== null)) {
                          _context16.next = 159;
                          break;
                        }

                        if (!App.checkAccountBalanceLimit) {
                          _context16.next = 101;
                          break;
                        }

                        _context16.t9 = Web3.utils;
                        _context16.next = 96;
                        return App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call();

                      case 96:
                        _context16.t10 = _context16.sent;
                        myFundBalanceBN = _context16.t9.toBN.call(_context16.t9, _context16.t10);
                        outputAmountUsdBN = mStableOutputAmountAfterFeeBN.mul(App.chainlinkPricesInUsd[mStableOutputCurrency]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[mStableOutputCurrency].decimals)));

                        if (!myFundBalanceBN.add(outputAmountUsdBN).gt(Web3.utils.toBN(350e18))) {
                          _context16.next = 101;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed"));

                      case 101:
                        // Warn user of slippage
                        epochNow = new Date().getTime();

                        if (!(!App.zeroExPrices[token] || epochNow > App.zeroExPrices[token]._lastUpdated + 60 * 1000)) {
                          _context16.next = 114;
                          break;
                        }

                        _context16.prev = 103;
                        _context16.next = 106;
                        return App.get0xPrices(token);

                      case 106:
                        App.zeroExPrices[token] = _context16.sent;
                        App.zeroExPrices[token]._lastUpdated = epochNow;
                        _context16.next = 114;
                        break;

                      case 110:
                        _context16.prev = 110;
                        _context16.t11 = _context16["catch"](103);

                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) < 0)) {
                          _context16.next = 114;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("Failed to get prices from 0x swap API: " + _context16.t11, "Deposit failed"));

                      case 114:
                        amountOutputted = parseFloat(mStableOutputAmountAfterFeeBN.toString()) / Math.pow(10, App.tokens[mStableOutputCurrency].decimals);

                        if (!(App.zeroExPrices[token] && App.zeroExPrices[token][mStableOutputCurrency])) {
                          _context16.next = 119;
                          break;
                        }

                        slippage = 1 - amountOutputted / amount * App.zeroExPrices[token][mStableOutputCurrency];
                        _context16.next = 124;
                        break;

                      case 119:
                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context16.next = 123;
                          break;
                        }

                        slippage = 1 - amountOutputted / amount;
                        _context16.next = 124;
                        break;

                      case 123:
                        return _context16.abrupt("return", toastr["error"]("Price not found on 0x swap API", "Deposit failed"));

                      case 124:
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#modal-confirm-deposit').is(':visible')) {
                          _context16.next = 130;
                          break;
                        }

                        $('#DepositZeroExGasPriceWarning').attr("style", "display: none !important;");
                        $('#DepositExchangeFee').hide();
                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context16.abrupt("return", $('#modal-confirm-deposit').modal('show'));

                      case 130:
                        if (!($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context16.next = 133;
                          break;
                        }

                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context16.abrupt("return", toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to process your deposit.", "Please try again"));

                      case 133:
                        _context16.prev = 133;
                        _context16.t12 = Web3.utils;
                        _context16.next = 137;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call();

                      case 137:
                        _context16.t13 = _context16.sent;
                        allowanceBN = _context16.t12.toBN.call(_context16.t12, _context16.t13);

                        if (!allowanceBN.lt(amountBN)) {
                          _context16.next = 142;
                          break;
                        }

                        _context16.next = 142;
                        return App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 142:
                        _context16.next = 147;
                        break;

                      case 144:
                        _context16.prev = 144;
                        _context16.t14 = _context16["catch"](133);
                        return _context16.abrupt("return", toastr["error"]("Failed to approve tokens to RariFundProxy: " + (_context16.t14.message ? _context16.t14.message : _context16.t14), "Deposit failed"));

                      case 147:
                        _context16.prev = 147;
                        console.log("RariFundProxy.exchangeAndDeposit parameters:", token, amountBN.toString(), mStableOutputCurrency);
                        _context16.next = 151;
                        return App.contracts.RariFundProxy.methods["exchangeAndDeposit(string,uint256,string)"](token, amountBN, mStableOutputCurrency).send({
                          from: App.selectedAccount
                        });

                      case 151:
                        receipt = _context16.sent;
                        _context16.next = 157;
                        break;

                      case 154:
                        _context16.prev = 154;
                        _context16.t15 = _context16["catch"](147);
                        return _context16.abrupt("return", toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + (_context16.t15.message ? _context16.t15.message : _context16.t15), "Deposit failed"));

                      case 157:
                        _context16.next = 252;
                        break;

                      case 159:
                        // Use first accepted currency for 0x
                        acceptedCurrency = App.acceptedCurrencies[0]; // Get orders from 0x swap API

                        _context16.prev = 160;
                        _context16.next = 163;
                        return App.get0xSwapOrders(token === "ETH" ? "WETH" : App.tokens[token].address, App.tokens[acceptedCurrency].address, amountBN);

                      case 163:
                        _yield$App$get0xSwapO = _context16.sent;
                        _yield$App$get0xSwapO2 = _slicedToArray(_yield$App$get0xSwapO, 6);
                        orders = _yield$App$get0xSwapO2[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO2[1];
                        protocolFee = _yield$App$get0xSwapO2[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO2[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO2[4];
                        gasPrice = _yield$App$get0xSwapO2[5];
                        _context16.next = 176;
                        break;

                      case 173:
                        _context16.prev = 173;
                        _context16.t16 = _context16["catch"](160);
                        return _context16.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context16.t16, "Deposit failed"));

                      case 176:
                        if (!App.checkAccountBalanceLimit) {
                          _context16.next = 185;
                          break;
                        }

                        _context16.t17 = Web3.utils;
                        _context16.next = 180;
                        return App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call();

                      case 180:
                        _context16.t18 = _context16.sent;
                        myFundBalanceBN = _context16.t17.toBN.call(_context16.t17, _context16.t18);
                        makerAssetFilledAmountUsdBN = makerAssetFilledAmountBN.mul(App.chainlinkPricesInUsd[acceptedCurrency]).div(Web3.utils.toBN(10).pow(Web3.utils.toBN(App.tokens[acceptedCurrency].decimals)));

                        if (!myFundBalanceBN.add(makerAssetFilledAmountUsdBN).gt(Web3.utils.toBN(350e18))) {
                          _context16.next = 185;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed"));

                      case 185:
                        amountOutputted = makerAssetFilledAmountBN.toString() / Math.pow(10, App.tokens[acceptedCurrency].decimals); // Make sure input amount is completely filled

                        if (!inputFilledAmountBN.lt(amountBN)) {
                          _context16.next = 189;
                          break;
                        }

                        $('#DepositAmount').val(inputFilledAmountBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals));
                        return _context16.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange " + token + " before depositing.", "Deposit canceled"));

                      case 189:
                        // Warn user of slippage
                        epochNow = new Date().getTime();

                        if (!(!App.zeroExPrices[token === "ETH" ? "WETH" : token] || epochNow > App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated + 60 * 1000)) {
                          _context16.next = 202;
                          break;
                        }

                        _context16.prev = 191;
                        _context16.next = 194;
                        return App.get0xPrices(token === "ETH" ? "WETH" : token);

                      case 194:
                        App.zeroExPrices[token === "ETH" ? "WETH" : token] = _context16.sent;
                        App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated = epochNow;
                        _context16.next = 202;
                        break;

                      case 198:
                        _context16.prev = 198;
                        _context16.t19 = _context16["catch"](191);

                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) < 0)) {
                          _context16.next = 202;
                          break;
                        }

                        return _context16.abrupt("return", toastr["error"]("Failed to get prices from 0x swap API: " + _context16.t19, "Deposit failed"));

                      case 202:
                        if (!(App.zeroExPrices[token === "ETH" ? "WETH" : token] && App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency])) {
                          _context16.next = 206;
                          break;
                        }

                        slippage = 1 - amountOutputted / amount * App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency];
                        _context16.next = 211;
                        break;

                      case 206:
                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context16.next = 210;
                          break;
                        }

                        slippage = 1 - amountOutputted / amount;
                        _context16.next = 211;
                        break;

                      case 210:
                        return _context16.abrupt("return", toastr["error"]("Price not found on 0x swap API", "Deposit failed"));

                      case 211:
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#modal-confirm-deposit').is(':visible')) {
                          _context16.next = 218;
                          break;
                        }

                        $('#DepositZeroExGasPriceWarning').attr("style", "display: block !important;");
                        $('#DepositExchangeFee kbd').html(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        $('#DepositExchangeFee').show();
                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context16.abrupt("return", $('#modal-confirm-deposit').modal('show'));

                      case 218:
                        if (!($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context16.next = 221;
                          break;
                        }

                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context16.abrupt("return", toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to process your deposit.", "Please try again"));

                      case 221:
                        if (!($('#DepositExchangeFee kbd').html().substring(0, $('#DepositExchangeFee kbd').html().indexOf("<") - 1) !== protocolFee / 1e18 + " ETH")) {
                          _context16.next = 224;
                          break;
                        }

                        $('#DepositExchangeFee kbd').html(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        return _context16.abrupt("return", toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to process your deposit.", "Please try again"));

                      case 224:
                        console.log('Exchange ' + amount + ' ' + token + ' to deposit ' + amountOutputted + ' ' + acceptedCurrency); // Approve tokens to RariFundProxy if token is not ETH

                        if (!(token !== "ETH")) {
                          _context16.next = 240;
                          break;
                        }

                        _context16.prev = 226;
                        _context16.t20 = Web3.utils;
                        _context16.next = 230;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call();

                      case 230:
                        _context16.t21 = _context16.sent;
                        allowanceBN = _context16.t20.toBN.call(_context16.t20, _context16.t21);

                        if (!allowanceBN.lt(amountBN)) {
                          _context16.next = 235;
                          break;
                        }

                        _context16.next = 235;
                        return App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 235:
                        _context16.next = 240;
                        break;

                      case 237:
                        _context16.prev = 237;
                        _context16.t22 = _context16["catch"](226);
                        return _context16.abrupt("return", toastr["error"]("Failed to approve tokens to RariFundProxy: " + (_context16.t22.message ? _context16.t22.message : _context16.t22), "Deposit failed"));

                      case 240:
                        // Build array of orders and signatures
                        signatures = [];

                        for (j = 0; j < orders.length; j++) {
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
                        } // Exchange and deposit tokens via RariFundProxy


                        _context16.prev = 242;
                        console.log("RariFundProxy.exchangeAndDeposit parameters:", token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN.toString(), acceptedCurrency, orders, signatures, takerAssetFilledAmountBN.toString());
                        _context16.next = 246;
                        return App.contracts.RariFundProxy.methods.exchangeAndDeposit(token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN, acceptedCurrency, orders, signatures, takerAssetFilledAmountBN).send({
                          from: App.selectedAccount,
                          value: token === "ETH" ? Web3.utils.toBN(protocolFee).add(amountBN).toString() : protocolFee,
                          gasPrice: gasPrice
                        });

                      case 246:
                        receipt = _context16.sent;
                        _context16.next = 252;
                        break;

                      case 249:
                        _context16.prev = 249;
                        _context16.t23 = _context16["catch"](242);
                        return _context16.abrupt("return", toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + (_context16.t23.message ? _context16.t23.message : _context16.t23), "Deposit failed"));

                      case 252:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Exchange and deposit", {
                          transactionHash: receipt.transactionHash,
                          inputCurrencyCode: token,
                          inputAmount: amount,
                          outputCurrencyCode: acceptedCurrency,
                          outputAmount: amountOutputted
                        }); // Hide old slippage after exchange success

                        $('#modal-confirm-deposit').modal('hide');

                      case 254:
                        // Alert success and refresh balances
                        toastr["success"]("Deposit of " + amount + " " + token + " confirmed!", "Deposit successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RSFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 262:
                      case "end":
                        return _context16.stop();
                    }
                  }
                }, _callee16, null, [[15, 26], [29, 35], [45, 85, 88, 91], [51, 57], [66, 72], [103, 110], [133, 144], [147, 154], [160, 173], [191, 198], [226, 237], [242, 249]]);
              }))();

            case 18:
              $('#depositButton').text("Deposit");
              $('#confirmDepositButton').text("Confirm");
              $('#depositButton, #confirmDepositButton').prop("disabled", false);

            case 21:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17);
    }));

    function handleDeposit(_x4) {
      return _handleDeposit.apply(this, arguments);
    }

    return handleDeposit;
  }(),

  /**
   * Withdraw funds from the stablecoin fund.
   */
  handleWithdraw: function () {
    var _handleWithdraw = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(event) {
      var token, amount, amountBN;
      return regeneratorRuntime.wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              event.preventDefault();
              token = $('#WithdrawToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context19.next = 4;
                break;
              }

              return _context19.abrupt("return", toastr["error"]("Invalid token!", "Withdrawal failed"));

            case 4:
              amount = parseFloat($('#WithdrawAmount').val());

              if (!(!amount || amount <= 0)) {
                _context19.next = 7;
                break;
              }

              return _context19.abrupt("return", toastr["error"]("Withdrawal amount must be greater than 0!", "Withdrawal failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context19.next = 11;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18() {
                var allowanceBN, tokenRawFundBalanceBN, receipt, inputCurrencyCodes, inputAmountBNs, allOrders, allSignatures, makerAssetFillAmountBNs, protocolFeeBNs, amountInputtedUsdBN, amountWithdrawnBN, totalProtocolFeeBN, inputCandidates, _i10, _arr3, inputToken, rawFundBalanceBN, mStableSwapFeeBN, i, inputAmountBN, outputAmountBeforeFeesBN, outputAmountBN, tries, redeemValidity, maxSwap, maxSwapInputBN, _yield$App$get0xSwapO3, _yield$App$get0xSwapO4, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, signatures, j, thisOutputAmountBN, thisInputAmountBN, epochNow, amountOutputtedUsd, slippage, slippageAbsPercentageString, inputAmountStrings, makerAssetFillAmountStrings, protocolFeeStrings, inputs;

                return regeneratorRuntime.wrap(function _callee18$(_context18) {
                  while (1) {
                    switch (_context18.prev = _context18.next) {
                      case 0:
                        App.getDirectlyWithdrawableCurrencies(); // Approve RFT to RariFundManager

                        _context18.prev = 1;
                        _context18.t0 = Web3.utils;
                        _context18.next = 5;
                        return App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call();

                      case 5:
                        _context18.t1 = _context18.sent;
                        allowanceBN = _context18.t0.toBN.call(_context18.t0, _context18.t1);

                        if (!allowanceBN.lt(Web3.utils.toBN(2).pow(Web3.utils.toBN(255)).subn(1))) {
                          _context18.next = 10;
                          break;
                        }

                        _context18.next = 10;
                        return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1)).send({
                          from: App.selectedAccount
                        });

                      case 10:
                        _context18.next = 15;
                        break;

                      case 12:
                        _context18.prev = 12;
                        _context18.t2 = _context18["catch"](1);
                        return _context18.abrupt("return", toastr["error"]("Failed to approve RSFT to RariFundManager: " + (_context18.t2.message ? _context18.t2.message : _context18.t2), "Withdrawal failed"));

                      case 15:
                        // See how much we can withdraw directly if token is not ETH
                        tokenRawFundBalanceBN = Web3.utils.toBN(0);

                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context18.next = 28;
                          break;
                        }

                        _context18.prev = 17;
                        _context18.t3 = Web3.utils;
                        _context18.next = 21;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](token).call();

                      case 21:
                        _context18.t4 = _context18.sent;
                        tokenRawFundBalanceBN = _context18.t3.toBN.call(_context18.t3, _context18.t4);
                        _context18.next = 28;
                        break;

                      case 25:
                        _context18.prev = 25;
                        _context18.t5 = _context18["catch"](17);
                        return _context18.abrupt("return", toastr["error"]("Failed to get raw fund balance of output currency: " + _context18.t5, "Withdrawal failed"));

                      case 28:
                        if (!tokenRawFundBalanceBN.gte(amountBN)) {
                          _context18.next = 43;
                          break;
                        }

                        // If we can withdraw everything directly, do so
                        if ($('#modal-confirm-withdrawal').is(':visible')) $('#modal-confirm-withdrawal').modal('hide');
                        console.log('Withdraw ' + amountBN + ' of ' + amount + ' ' + token + ' directly');
                        _context18.prev = 31;
                        _context18.next = 34;
                        return App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 34:
                        receipt = _context18.sent;
                        _context18.next = 40;
                        break;

                      case 37:
                        _context18.prev = 37;
                        _context18.t6 = _context18["catch"](31);
                        return _context18.abrupt("return", toastr["error"]("RariFundManager.withdraw failed: " + (_context18.t6.message ? _context18.t6.message : _context18.t6), "Withdrawal failed"));

                      case 40:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct withdrawal", {
                          transactionHash: receipt.transactionHash,
                          currencyCode: token,
                          amount: amount
                        });
                        _context18.next = 264;
                        break;

                      case 43:
                        // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
                        inputCurrencyCodes = [];
                        inputAmountBNs = [];
                        allOrders = [];
                        allSignatures = [];
                        makerAssetFillAmountBNs = [];
                        protocolFeeBNs = [];
                        amountInputtedUsdBN = Web3.utils.toBN(0);
                        amountWithdrawnBN = Web3.utils.toBN(0);
                        totalProtocolFeeBN = Web3.utils.toBN(0); // Withdraw as much as we can of the output token first

                        if (tokenRawFundBalanceBN.gt(Web3.utils.toBN(0))) {
                          inputCurrencyCodes.push(token);
                          inputAmountBNs.push(tokenRawFundBalanceBN);
                          allOrders.push([]);
                          allSignatures.push([]);
                          makerAssetFillAmountBNs.push(0);
                          protocolFeeBNs.push(0);
                          amountInputtedUsdBN.iadd(tokenRawFundBalanceBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, App.tokens[token].decimals))));
                          amountWithdrawnBN.iadd(tokenRawFundBalanceBN);
                        } // Get input candidates


                        inputCandidates = [];
                        _i10 = 0, _arr3 = ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"];

                      case 55:
                        if (!(_i10 < _arr3.length)) {
                          _context18.next = 67;
                          break;
                        }

                        inputToken = _arr3[_i10];

                        if (!(inputToken !== token)) {
                          _context18.next = 64;
                          break;
                        }

                        _context18.t7 = Web3.utils;
                        _context18.next = 61;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](inputToken).call();

                      case 61:
                        _context18.t8 = _context18.sent;
                        rawFundBalanceBN = _context18.t7.toBN.call(_context18.t7, _context18.t8);
                        if (rawFundBalanceBN.gt(Web3.utils.toBN(0))) inputCandidates.push({
                          currencyCode: inputToken,
                          rawFundBalanceBN: rawFundBalanceBN
                        });

                      case 64:
                        _i10++;
                        _context18.next = 55;
                        break;

                      case 67:
                        // Sort candidates from lowest to highest rawFundBalanceBN
                        inputCandidates.sort(function (a, b) {
                          return a.rawFundBalanceBN.gt(b.rawFundBalanceBN) ? 1 : -1;
                        }); // mStable

                        mStableSwapFeeBN = null;

                        if (!(["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context18.next = 138;
                          break;
                        }

                        i = 0;

                      case 71:
                        if (!(i < inputCandidates.length)) {
                          _context18.next = 138;
                          break;
                        }

                        if (!(["DAI", "USDC", "USDT", "TUSD", "mUSD"].indexOf(inputCandidates[i].currencyCode) < 0)) {
                          _context18.next = 74;
                          break;
                        }

                        return _context18.abrupt("continue", 135);

                      case 74:
                        if (!(token !== "mUSD" && mStableSwapFeeBN === null)) {
                          _context18.next = 78;
                          break;
                        }

                        _context18.next = 77;
                        return App.getMStableSwapFeeBN();

                      case 77:
                        mStableSwapFeeBN = _context18.sent;

                      case 78:
                        inputAmountBN = amountBN.sub(amountWithdrawnBN).mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(1e18).sub(mStableSwapFeeBN)).mul(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals))).div(Web3.utils.toBN(Math.pow(10, App.tokens[token].decimals)));
                        outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(Math.pow(10, App.tokens[token].decimals))).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals)));
                        outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
                        tries = 0;

                      case 82:
                        if (!outputAmountBN.lt(amountBN.sub(amountWithdrawnBN))) {
                          _context18.next = 91;
                          break;
                        }

                        if (!(tries >= 1000)) {
                          _context18.next = 85;
                          break;
                        }

                        return _context18.abrupt("return", toastr["error"]("Failed to get increment order input amount to achieve desired output amount", "Withdrawal failed"));

                      case 85:
                        inputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input amount to receive amountBN.sub(amountWithdrawnBN)

                        outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(Math.pow(10, App.tokens[token].decimals))).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals)));
                        outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
                        tries++;
                        _context18.next = 82;
                        break;

                      case 91:
                        if (inputAmountBN.gt(inputCandidates[i].rawFundBalanceBN)) {
                          inputAmountBN = inputCandidates[i].rawFundBalanceBN;
                          outputAmountBeforeFeesBN = inputAmountBN.mul(Web3.utils.toBN(Math.pow(10, App.tokens[token].decimals))).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals)));
                          outputAmountBN = token === "mUSD" ? outputAmountBeforeFeesBN : outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(mStableSwapFeeBN).div(Web3.utils.toBN(1e18)));
                        } // Check max mint/redeem/swap


                        if (!(inputCandidates[i].currencyCode === "mUSD")) {
                          _context18.next = 107;
                          break;
                        }

                        _context18.prev = 93;
                        _context18.next = 96;
                        return App.contracts.MassetValidationHelper.methods.getRedeemValidity("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", inputAmountBN, App.tokens[token].address).call();

                      case 96:
                        redeemValidity = _context18.sent;
                        _context18.next = 103;
                        break;

                      case 99:
                        _context18.prev = 99;
                        _context18.t9 = _context18["catch"](93);
                        console.error("Failed to check mUSD redeem validity:", _context18.t9);
                        return _context18.abrupt("continue", 135);

                      case 103:
                        if (!(!redeemValidity || !redeemValidity["0"])) {
                          _context18.next = 105;
                          break;
                        }

                        return _context18.abrupt("continue", 135);

                      case 105:
                        _context18.next = 123;
                        break;

                      case 107:
                        _context18.prev = 107;
                        _context18.next = 110;
                        return App.contracts.MassetValidationHelper.methods.getMaxSwap("0xe2f2a5c287993345a840db3b0845fbc70f5935a5", App.tokens[inputCandidates[i].currencyCode].address, App.tokens[token].address).call();

                      case 110:
                        maxSwap = _context18.sent;
                        _context18.next = 117;
                        break;

                      case 113:
                        _context18.prev = 113;
                        _context18.t10 = _context18["catch"](107);
                        console.error("Failed to check mUSD max swap:", _context18.t10);
                        return _context18.abrupt("continue", 135);

                      case 117:
                        if (!(!maxSwap || !maxSwap["0"])) {
                          _context18.next = 119;
                          break;
                        }

                        return _context18.abrupt("continue", 135);

                      case 119:
                        maxSwapInputBN = Web3.utils.toBN(maxSwap["2"]);

                        if (!maxSwapInputBN.isZero()) {
                          _context18.next = 122;
                          break;
                        }

                        return _context18.abrupt("continue", 135);

                      case 122:
                        // Set input and output amounts to maximums
                        if (inputAmountBN.gt(maxSwapInputBN)) {
                          inputAmountBN = maxSwapInputBN;
                          outputAmountBN = Web3.utils.toBN(maxSwap["3"]);
                        }

                      case 123:
                        inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                        inputAmountBNs.push(inputAmountBN);
                        allOrders.push([]);
                        allSignatures.push([]);
                        makerAssetFillAmountBNs.push(0);
                        protocolFeeBNs.push(0);
                        amountInputtedUsdBN.iadd(inputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals))));
                        amountWithdrawnBN.iadd(outputAmountBN);
                        inputCandidates[i].rawFundBalanceBN.isub(inputAmountBN);
                        if (inputCandidates[i].rawFundBalanceBN.isZero()) inputCandidates = inputCandidates.splice(i, 1); // Stop if we have filled the withdrawal

                        if (!amountWithdrawnBN.gte(amountBN)) {
                          _context18.next = 135;
                          break;
                        }

                        return _context18.abrupt("break", 138);

                      case 135:
                        i++;
                        _context18.next = 71;
                        break;

                      case 138:
                        if (!amountWithdrawnBN.lt(amountBN)) {
                          _context18.next = 201;
                          break;
                        }

                        i = 0;

                      case 140:
                        if (!(i < inputCandidates.length)) {
                          _context18.next = 168;
                          break;
                        }

                        _context18.prev = 141;
                        _context18.next = 144;
                        return App.get0xSwapOrders(App.tokens[inputCandidates[i].currencyCode].address, token === "ETH" ? "WETH" : App.tokens[token].address, inputCandidates[i].rawFundBalanceBN, amountBN.sub(amountWithdrawnBN));

                      case 144:
                        _yield$App$get0xSwapO3 = _context18.sent;
                        _yield$App$get0xSwapO4 = _slicedToArray(_yield$App$get0xSwapO3, 6);
                        orders = _yield$App$get0xSwapO4[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO4[1];
                        protocolFee = _yield$App$get0xSwapO4[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO4[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO4[4];
                        gasPrice = _yield$App$get0xSwapO4[5];
                        _context18.next = 157;
                        break;

                      case 154:
                        _context18.prev = 154;
                        _context18.t11 = _context18["catch"](141);
                        return _context18.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context18.t11, "Withdrawal failed"));

                      case 157:
                        // Build array of orders and signatures
                        signatures = [];

                        for (j = 0; j < orders.length; j++) {
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

                      case 165:
                        i++;
                        _context18.next = 140;
                        break;

                      case 168:
                        // Sort candidates from lowest to highest takerAssetFillAmount
                        inputCandidates.sort(function (a, b) {
                          return a.makerAssetFillAmountBN.gt(b.makerAssetFillAmountBN) ? 1 : -1;
                        }); // Loop through input currency candidates until we fill the withdrawal

                        i = 0;

                      case 170:
                        if (!(i < inputCandidates.length)) {
                          _context18.next = 198;
                          break;
                        }

                        if (!inputCandidates[i].makerAssetFillAmountBN.gte(amountBN.sub(amountWithdrawnBN))) {
                          _context18.next = 192;
                          break;
                        }

                        thisOutputAmountBN = amountBN.sub(amountWithdrawnBN);
                        thisInputAmountBN = inputCandidates[i].inputFillAmountBN.mul(thisOutputAmountBN).div(inputCandidates[i].makerAssetFillAmountBN);
                        tries = 0;

                      case 175:
                        if (!inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).lt(thisOutputAmountBN)) {
                          _context18.next = 182;
                          break;
                        }

                        if (!(tries >= 1000)) {
                          _context18.next = 178;
                          break;
                        }

                        return _context18.abrupt("return", toastr["error"]("Failed to get increment order input amount to achieve desired output amount", "Withdrawal failed"));

                      case 178:
                        thisInputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount

                        tries++;
                        _context18.next = 175;
                        break;

                      case 182:
                        inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                        inputAmountBNs.push(thisInputAmountBN);
                        allOrders.push(inputCandidates[i].orders);
                        allSignatures.push(inputCandidates[i].signatures);
                        makerAssetFillAmountBNs.push(thisOutputAmountBN);
                        protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        amountInputtedUsdBN.iadd(thisInputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals))));
                        amountWithdrawnBN.iadd(thisOutputAmountBN);
                        totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        return _context18.abrupt("break", 198);

                      case 192:
                        // Add all that we can of the last one, then go through them again
                        if (i == inputCandidates.length - 1) {
                          inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                          inputAmountBNs.push(inputCandidates[i].inputFillAmountBN);
                          allOrders.push(inputCandidates[i].orders);
                          allSignatures.push(inputCandidates[i].signatures);
                          makerAssetFillAmountBNs.push(inputCandidates[i].makerAssetFillAmountBN);
                          protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));
                          amountInputtedUsdBN.iadd(inputCandidates[i].inputFillAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals))));
                          amountWithdrawnBN.iadd(inputCandidates[i].makerAssetFillAmountBN);
                          totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));
                          i = -1;
                          inputCandidates.pop();
                        } // Stop if we have filled the withdrawal


                        if (!amountWithdrawnBN.gte(amountBN)) {
                          _context18.next = 195;
                          break;
                        }

                        return _context18.abrupt("break", 198);

                      case 195:
                        i++;
                        _context18.next = 170;
                        break;

                      case 198:
                        if (!amountWithdrawnBN.lt(amountBN)) {
                          _context18.next = 201;
                          break;
                        }

                        $('#WithdrawAmount').val(amountWithdrawnBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals));
                        return _context18.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange withdrawn tokens to " + token + ".", "Withdrawal canceled"));

                      case 201:
                        // Warn user of slippage
                        epochNow = new Date().getTime();

                        if (!(!App.zeroExPrices["DAI"] || epochNow > App.zeroExPrices["DAI"]._lastUpdated + 60 * 1000)) {
                          _context18.next = 213;
                          break;
                        }

                        _context18.prev = 203;
                        _context18.next = 206;
                        return App.get0xPrices("DAI");

                      case 206:
                        App.zeroExPrices["DAI"] = _context18.sent;
                        App.zeroExPrices["DAI"]._lastUpdated = epochNow;
                        _context18.next = 213;
                        break;

                      case 210:
                        _context18.prev = 210;
                        _context18.t12 = _context18["catch"](203);
                        return _context18.abrupt("return", toastr["error"]("Failed to get prices from 0x swap API: " + _context18.t12, "Withdrawal failed"));

                      case 213:
                        if (!App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]) {
                          _context18.next = 217;
                          break;
                        }

                        amountOutputtedUsd = amount * App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]; // TODO: Use actual input currencies instead of using DAI for USD price

                        _context18.next = 222;
                        break;

                      case 217:
                        if (!(["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"].indexOf(token) >= 0)) {
                          _context18.next = 221;
                          break;
                        }

                        amountOutputtedUsd = amount;
                        _context18.next = 222;
                        break;

                      case 221:
                        return _context18.abrupt("return", toastr["error"]("Price not found on 0x swap API", "Withdrawal failed"));

                      case 222:
                        slippage = 1 - amountOutputtedUsd / (amountInputtedUsdBN.toString() / 1e18);
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#modal-confirm-withdrawal').is(':visible')) {
                          _context18.next = 230;
                          break;
                        }

                        $('#WithdrawExchangeFee kbd').html(totalProtocolFeeBN.toString() / 1e18 + ' ETH <small>($' + (totalProtocolFeeBN.toString() / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        $('#WithdrawExchangeFee').show();
                        totalProtocolFeeBN.gt(Web3.utils.toBN(0)) ? $('#WithdrawZeroExGasPriceWarning').attr("style", "display: block !important;") : $('#WithdrawZeroExGasPriceWarning').attr("style", "display: none !important;");
                        $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context18.abrupt("return", $('#modal-confirm-withdrawal').modal('show'));

                      case 230:
                        if (!($('#WithdrawSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context18.next = 233;
                          break;
                        }

                        $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context18.abrupt("return", toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to make your withdrawal.", "Please try again"));

                      case 233:
                        if (!($('#WithdrawExchangeFee kbd').html().substring(0, $('#WithdrawExchangeFee kbd').html().indexOf("<") - 1) !== totalProtocolFeeBN.toString() / 1e18 + " ETH")) {
                          _context18.next = 237;
                          break;
                        }

                        $('#WithdrawExchangeFee kbd').html(totalProtocolFeeBN.toString() / 1e18 + ' ETH <small>($' + (totalProtocolFeeBN.toString() / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        totalProtocolFeeBN.gt(Web3.utils.toBN(0)) ? $('#WithdrawZeroExGasPriceWarning').attr("style", "display: block !important;") : $('#WithdrawZeroExGasPriceWarning').attr("style", "display: none !important;");
                        return _context18.abrupt("return", toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to make your withdrawal.", "Please try again"));

                      case 237:
                        console.log('Withdraw and exchange to ' + amountWithdrawnBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals) + ' ' + token); // Withdraw and exchange tokens via RariFundProxy

                        _context18.prev = 238;
                        inputAmountStrings = [];

                        for (i = 0; i < inputAmountBNs.length; i++) {
                          inputAmountStrings[i] = inputAmountBNs[i].toString();
                        }

                        makerAssetFillAmountStrings = [];

                        for (i = 0; i < makerAssetFillAmountBNs.length; i++) {
                          makerAssetFillAmountStrings[i] = makerAssetFillAmountBNs[i].toString();
                        }

                        protocolFeeStrings = [];

                        for (i = 0; i < protocolFeeBNs.length; i++) {
                          protocolFeeStrings[i] = protocolFeeBNs[i].toString();
                        }

                        console.log("RariFundProxy.withdrawAndExchange parameters:", inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
                        _context18.t13 = App.contracts.RariFundProxy.methods.withdrawAndExchange(inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
                        _context18.t14 = App.selectedAccount;
                        _context18.t15 = totalProtocolFeeBN;
                        _context18.t16 = gasPrice;
                        _context18.next = 252;
                        return App.web3.eth.getTransactionCount(App.selectedAccount);

                      case 252:
                        _context18.t17 = _context18.sent;
                        _context18.t18 = {
                          from: _context18.t14,
                          value: _context18.t15,
                          gasPrice: _context18.t16,
                          nonce: _context18.t17
                        };
                        _context18.next = 256;
                        return _context18.t13.send.call(_context18.t13, _context18.t18);

                      case 256:
                        receipt = _context18.sent;
                        _context18.next = 262;
                        break;

                      case 259:
                        _context18.prev = 259;
                        _context18.t19 = _context18["catch"](238);
                        return _context18.abrupt("return", toastr["error"]("RariFundProxy.withdrawAndExchange failed: " + (_context18.t19.message ? _context18.t19.message : _context18.t19), "Withdrawal failed"));

                      case 262:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') {
                          inputs = [];

                          for (i = 0; i < inputCurrencyCodes.length; i++) {
                            inputs.push({
                              currencyCode: inputCurrencyCodes[i],
                              amount: inputAmountBNs[i].toString() / Math.pow(10, App.tokens[inputCurrencyCodes[i]].decimals)
                            });
                          }

                          mixpanel.track("Withdraw and exchange", {
                            transactionHash: receipt.transactionHash,
                            inputs: inputs,
                            outputCurrencyCode: token,
                            outputAmount: amount
                          });
                        } // Hide old slippage after exchange success


                        $('#modal-confirm-withdrawal').modal('hide');

                      case 264:
                        // Alert success and refresh balances
                        toastr["success"]("Withdrawal of " + amount + " " + token + " confirmed!", "Withdrawal successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RSFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 272:
                      case "end":
                        return _context18.stop();
                    }
                  }
                }, _callee18, null, [[1, 12], [17, 25], [31, 37], [93, 99], [107, 113], [141, 154], [203, 210], [238, 259]]);
              }))();

            case 11:
              $('#withdrawButton').text("Withdraw");
              $('#confirmWithdrawalButton').text("Confirm");
              $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", false);

            case 14:
            case "end":
              return _context19.stop();
          }
        }
      }, _callee19);
    }));

    function handleWithdraw(_x5) {
      return _handleWithdraw.apply(this, arguments);
    }

    return handleWithdraw;
  }(),

  /**
   * Get the total balance of the stablecoin fund in USD.
   */
  getFundBalance: function getFundBalance() {
    console.log('Getting fund balance...');
    App.contracts.RariFundManager.methods.getFundBalance().call().then(function (result) {
      $('#USDBalance').text(new Big(result).div(new Big(10).pow(18)).toFormat(4));
    }).catch(function (err) {
      console.error(err);
    });
  },

  /**
   * Get the user's account balance in the stablecoin fund in USD.
   */
  getMyFundBalance: function getMyFundBalance() {
    console.log('Getting my fund balance...');
    App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call().then(function (result) {
      $('#MyUSDBalance').text(new Big(result).div(new Big(10).pow(18)).toFormat());
    }).catch(function (err) {
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
  handleTransfer: function () {
    var _handleTransfer = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(event) {
      var currency, amount, amountBN, toAddress;
      return regeneratorRuntime.wrap(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              event.preventDefault();
              currency = $('#TransferCurrency').val();

              if (!(["USD", "RSFT"].indexOf(currency) < 0)) {
                _context21.next = 4;
                break;
              }

              return _context21.abrupt("return", toastr["error"]("Invalid currency!", "Transfer failed"));

            case 4:
              amount = parseFloat($('#TransferAmount').val());

              if (!(!amount || amount <= 0)) {
                _context21.next = 7;
                break;
              }

              return _context21.abrupt("return", toastr["error"]("Transfer amount must be greater than 0!", "Transfer failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(18)).toFixed());
              toAddress = $('#TransferAddress').val();

              if (toAddress) {
                _context21.next = 11;
                break;
              }

              return _context21.abrupt("return", toastr["error"]("You must enter a destination address!", "Transfer failed"));

            case 11:
              $('#transferButton').prop("disabled", true);
              $('#transferButton').html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context21.next = 15;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
                var fundBalanceBN, rftTotalSupplyBN, rftAmountBN, receipt;
                return regeneratorRuntime.wrap(function _callee20$(_context20) {
                  while (1) {
                    switch (_context20.prev = _context20.next) {
                      case 0:
                        console.log('Transfer ' + amount + ' ' + currency + ' to ' + toAddress);

                        if (!(currency === "USD")) {
                          _context20.next = 15;
                          break;
                        }

                        _context20.t0 = Web3.utils;
                        _context20.next = 5;
                        return App.contracts.RariFundManager.methods.getFundBalance().call();

                      case 5:
                        _context20.t1 = _context20.sent;
                        fundBalanceBN = _context20.t0.toBN.call(_context20.t0, _context20.t1);
                        _context20.t2 = Web3.utils;
                        _context20.next = 10;
                        return App.contracts.RariFundToken.methods.totalSupply().call();

                      case 10:
                        _context20.t3 = _context20.sent;
                        rftTotalSupplyBN = _context20.t2.toBN.call(_context20.t2, _context20.t3);
                        rftAmountBN = amountBN.mul(rftTotalSupplyBN).div(fundBalanceBN);
                        _context20.next = 16;
                        break;

                      case 15:
                        rftAmountBN = amountBN;

                      case 16:
                        _context20.prev = 16;
                        _context20.next = 19;
                        return App.contracts.RariFundToken.methods.transfer(toAddress, rftAmountBN).send({
                          from: App.selectedAccount
                        });

                      case 19:
                        receipt = _context20.sent;
                        _context20.next = 25;
                        break;

                      case 22:
                        _context20.prev = 22;
                        _context20.t4 = _context20["catch"](16);
                        return _context20.abrupt("return", toastr["error"](_context20.t4, "Transfer failed"));

                      case 25:
                        if (typeof mixpanel !== 'undefined') mixpanel.track("RSFT transfer", {
                          transactionHash: receipt.transactionHash,
                          currencyCode: currency,
                          amount: amount
                        });
                        toastr["success"]("Transfer of " + (currency === "USD" ? "$" : "") + amount + " " + currency + " confirmed!", "Transfer successful");
                        $('#RSFTBalance').text("?");
                        App.getTokenBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();

                      case 31:
                      case "end":
                        return _context20.stop();
                    }
                  }
                }, _callee20, null, [[16, 22]]);
              }))();

            case 15:
              $('#transferButton').text("Transfer");
              $('#transferButton').prop("disabled", false);

            case 17:
            case "end":
              return _context21.stop();
          }
        }
      }, _callee21);
    }));

    function handleTransfer(_x6) {
      return _handleTransfer.apply(this, arguments);
    }

    return handleTransfer;
  }(),

  /**
   * Get's the user's balance of RariFundToken.
   */
  getTokenBalance: function getTokenBalance() {
    console.log('Getting token balance...');
    App.contracts.RariFundToken.methods.balanceOf(App.selectedAccount).call().then(function (result) {
      $('#RSFTBalance').text(new Big(result).div(new Big(10).pow(18)).toFormat());
    }).catch(function (err) {
      console.error(err);
    });
  }
};
$(function () {
  $(document).ready(function () {
    App.init();
  });
});

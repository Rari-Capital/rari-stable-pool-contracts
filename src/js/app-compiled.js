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
    }
  },
  erc20Abi: null,
  zeroExPrices: {},
  usdPrices: {},
  usdPricesLastUpdated: 0,
  checkAccountBalanceLimit: true,
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
    App.initAprChart();
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
      var factors, totalBalanceUsdBN, dydxApyBNs, compoundApyBNs, _i, _arr, currencyCode, contractBalanceBN, contractBalanceUsdBN, poolBalances, i, poolBalanceBN, poolBalanceUsdBN, apyBN, maxApyBN;

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
              _i = 0, _arr = ["DAI", "USDC", "USDT"];

            case 9:
              if (!(_i < _arr.length)) {
                _context.next = 26;
                break;
              }

              currencyCode = _arr[_i];
              _context.t0 = Web3.utils;
              _context.next = 14;
              return App.tokens[currencyCode].contract.methods.balanceOf(App.contracts.RariFundController.options.address).call();

            case 14:
              _context.t1 = _context.sent;
              contractBalanceBN = _context.t0.toBN.call(_context.t0, _context.t1);
              contractBalanceUsdBN = contractBalanceBN.mul(Web3.utils.toBN(Math.pow(10, App.tokens[currencyCode].decimals))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

              factors.push([contractBalanceUsdBN, Web3.utils.toBN(0)]);
              totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN);
              _context.next = 21;
              return App.contracts.RariFundController.methods.getPoolBalances(currencyCode).call();

            case 21:
              poolBalances = _context.sent;

              for (i = 0; i < poolBalances["0"].length; i++) {
                poolBalanceBN = Web3.utils.toBN(poolBalances["1"][i]);
                poolBalanceUsdBN = poolBalanceBN.mul(Web3.utils.toBN(Math.pow(10, App.tokens[currencyCode].decimals))); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

                apyBN = poolBalances["0"][i] == 1 ? compoundApyBNs[currencyCode][0].add(compoundApyBNs[currencyCode][1]) : dydxApyBNs[currencyCode];
                factors.push([poolBalanceUsdBN, apyBN]);
                totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN);
              }

            case 23:
              _i++;
              _context.next = 9;
              break;

            case 26:
              if (!totalBalanceUsdBN.isZero()) {
                _context.next = 30;
                break;
              }

              maxApyBN = 0;

              for (i = 0; i < factors.length; i++) {
                if (factors[i][1].gt(maxApyBN)) maxApyBN = factors[i][1];
              }

              return _context.abrupt("return", $('#APYNow').text((parseFloat(maxApyBN.toString()) / 1e16).toFixed(2) + "%"));

            case 30:
              apyBN = Web3.utils.toBN(0);

              for (i = 0; i < factors.length; i++) {
                apyBN.iadd(factors[i][0].mul(factors[i][1]).div(totalBalanceUsdBN));
              }

              $('#APYNow').text((parseFloat(apyBN.toString()) / 1e16).toFixed(2) + "%");

            case 33:
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

          for (var _i2 = 0, _Object$keys = Object.keys(decoded); _i2 < _Object$keys.length; _i2++) {
            var key = _Object$keys[_i2];
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
    var _getApyFromComp = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(currencyCode, cTokens) {
      var currencyCodes, priceMissing, _iterator2, _step2, cToken, now, currencyUnderlyingSupply, currencyBorrowUsd, totalBorrowUsd, _iterator3, _step3, _cToken, underlyingBorrow, borrowUsd, compPerBlock, marketCompPerBlock, marketSupplierCompPerBlock, marketSupplierCompPerBlockPerUsd, marketSupplierUsdFromCompPerBlockPerUsd;

      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
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
                _context4.next = 10;
                break;
              }

              _context4.next = 8;
              return App.getCurrencyUsdRates(currencyCodes);

            case 8:
              App.usdPrices = _context4.sent;
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
              return _context4.abrupt("return", marketSupplierUsdFromCompPerBlockPerUsd * 2102400);

            case 21:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    function getApyFromComp(_x, _x2) {
      return _getApyFromComp.apply(this, arguments);
    }

    return getApyFromComp;
  }(),
  initAprChart: function initAprChart() {
    Promise.all([$.getJSON("dydx-aprs.json?v=1595961244"), $.getJSON("compound-aprs.json?v=1595961244")]).then(function (values) {
      var ourData = {};
      var dydxAvgs = [];
      var epochs = Object.keys(values[0]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (var _i3 = 0, _Object$keys2 = Object.keys(values[0][epochs[i]]); _i3 < _Object$keys2.length; _i3++) {
          var currencyCode = _Object$keys2[_i3];
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

        for (var _i4 = 0, _Object$keys3 = Object.keys(values[1][epochs[i]]); _i4 < _Object$keys3.length; _i4++) {
          var _currencyCode = _Object$keys3[_i4];
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
      ctx.canvas.width = 1000;
      ctx.canvas.height = 300;
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
          }]
        },
        options: {
          animation: {
            duration: 0
          },
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

      var ourReturns = [];
      currentReturn = 10000;

      for (var i = 0; i < ourAvgs.length; i++) {
        ourReturns.push({
          t: ourAvgs[i].t,
          y: currentReturn *= 1 + ourAvgs[i].y / 100 / 365
        });
      } // Init chart


      var ctx = document.getElementById('chart-return').getContext('2d');
      ctx.canvas.width = 1000;
      ctx.canvas.height = 300;
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
          }]
        },
        options: {
          animation: {
            duration: 0
          },
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

                label += "$" + parseFloat(tooltipItem.value).toFixed(2);
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
    var _fetchAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
      var approveFunction, chainId, _i5, _Object$keys4, symbol, _i6, _Object$keys5, _symbol, i;

      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              // Get a Web3 instance for the wallet
              App.web3 = new Web3(App.web3Provider);

              approveFunction = /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(_ref) {
                  var from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress, response;
                  return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          from = _ref.from, to = _ref.to, encodedFunctionCall = _ref.encodedFunctionCall, txFee = _ref.txFee, gasPrice = _ref.gasPrice, gas = _ref.gas, nonce = _ref.nonce, relayerAddress = _ref.relayerAddress, relayHubAddress = _ref.relayHubAddress;
                          _context5.prev = 1;
                          _context5.next = 4;
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
                          response = _context5.sent;
                          _context5.next = 10;
                          break;

                        case 7:
                          _context5.prev = 7;
                          _context5.t0 = _context5["catch"](1);
                          return _context5.abrupt("return", console.error("checkSig error:", _context5.t0));

                        case 10:
                          console.log("checkSig response:", response);
                          return _context5.abrupt("return", response);

                        case 12:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, null, [[1, 7]]);
                }));

                return function approveFunction(_x3) {
                  return _ref2.apply(this, arguments);
                };
              }();

              App.web3Gsn = new Web3(new OpenZeppelinGSNProvider.GSNProvider(App.web3Provider, {
                approveFunction: approveFunction
              })); // Get connected chain ID from Ethereum node

              _context6.next = 5;
              return App.web3.eth.getChainId();

            case 5:
              chainId = _context6.sent;
              _context6.next = 8;
              return App.web3.eth.getAccounts();

            case 8:
              App.accounts = _context6.sent;
              App.selectedAccount = App.accounts[0]; // Mixpanel

              if (typeof mixpanel !== 'undefined') {
                mixpanel.identify(App.selectedAccount);
                mixpanel.people.set({
                  "Ethereum Address": App.selectedAccount,
                  "App Version": "1.2.0"
                });
              } // Refresh contracts to use new Web3


              for (_i5 = 0, _Object$keys4 = Object.keys(App.contracts); _i5 < _Object$keys4.length; _i5++) {
                symbol = _Object$keys4[_i5];
                App.contracts[symbol] = new App.web3.eth.Contract(App.contracts[symbol].options.jsonInterface, App.contracts[symbol].options.address);
              }

              App.contractsGsn.RariFundProxy = new App.web3Gsn.eth.Contract(App.contracts.RariFundProxy.options.jsonInterface, App.contracts.RariFundProxy.options.address);

              for (_i6 = 0, _Object$keys5 = Object.keys(App.tokens); _i6 < _Object$keys5.length; _i6++) {
                _symbol = _Object$keys5[_i6];
                if (App.tokens[_symbol].contract) App.tokens[_symbol].contract = new App.web3.eth.Contract(App.tokens[_symbol].contract.options.jsonInterface, App.tokens[_symbol].address);
              } // Get user's account balance in the stablecoin fund and RFT balance


              if (App.contracts.RariFundManager) {
                App.getMyFundBalance();
                if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
                App.getMyInterestAccrued();
                if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000);
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
              return _context6.stop();
          }
        }
      }, _callee6);
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
    var _refreshAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              // If any current data is displayed when
              // the user is switching acounts in the wallet
              // immediate hide this data
              $("#MyDAIBalance, #MyUSDCBalance, #MyUSDTBalance, #RFTBalance").text("?"); // Disable button while UI is loading.
              // fetchAccountData() will take a while as it communicates
              // with Ethereum node via JSON-RPC and loads chain data
              // over an API call.

              $(".btn-connect").text("Loading...");
              $(".btn-connect").prop("disabled", true);
              _context7.next = 5;
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
              return _context7.stop();
          }
        }
      }, _callee7);
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
    var _connectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              // Setting this null forces to show the dialogue every time
              // regardless if we play around with a cacheProvider settings
              // in our localhost.
              // TODO: A clean API needed here
              App.web3Modal.providerController.cachedProvider = null;
              _context8.prev = 1;
              _context8.next = 4;
              return App.web3Modal.connect();

            case 4:
              App.web3Provider = _context8.sent;
              _context8.next = 11;
              break;

            case 7:
              _context8.prev = 7;
              _context8.t0 = _context8["catch"](1);
              console.error("Could not get a wallet connection", _context8.t0);
              return _context8.abrupt("return");

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

              _context8.next = 14;
              return App.refreshAccountData();

            case 14:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, null, [[1, 7]]);
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
    var _disconnectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              console.log("Killing the wallet connection", App.web3Provider); // TODO: MetamaskInpageProvider does not provide disconnect?

              if (!App.web3Provider.close) {
                _context9.next = 5;
                break;
              }

              _context9.next = 4;
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
              $('#RFTBalance').text("?");
              $('#MyInterestAccrued').text("?");

            case 13:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
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
    });
  },

  /**
   * Initialize FundManager and FundToken contracts.
   */
  initContracts: function initContracts() {
    $.getJSON('abi/RariFundController.json?v=1595276956', function (data) {
      App.contracts.RariFundController = new App.web3.eth.Contract(data, "0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb");
      App.getCurrentApy();
      setInterval(App.getCurrentApy, 5 * 60 * 1000);
    });
    $.getJSON('abi/RariFundManager.json?v=1595276956', function (data) {
      App.contracts.RariFundManager = new App.web3.eth.Contract(data, "0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464");
      App.getFundBalance();
      setInterval(App.getFundBalance, 5 * 60 * 1000);

      if (App.selectedAccount) {
        App.getMyFundBalance();
        if (!App.intervalGetMyFundBalance) App.intervalGetMyFundBalance = setInterval(App.getMyFundBalance, 5 * 60 * 1000);
        App.getMyInterestAccrued();
        if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000);
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
    $.getJSON('abi/RariFundProxy.json?v=1595276956', function (data) {
      App.contracts.RariFundProxy = new App.web3.eth.Contract(data, "0xb6b79d857858004bf475e4a57d4a446da4884866");
    });
    $.getJSON('abi/ERC20.json', function (data) {
      App.erc20Abi = data;

      for (var _i7 = 0, _Object$keys6 = Object.keys(App.tokens); _i7 < _Object$keys6.length; _i7++) {
        var symbol = _Object$keys6[_i7];
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
  },
  getDirectlyDepositableCurrencies: function getDirectlyDepositableCurrencies() {
    var _loop2 = function _loop2() {
      var currencyCode = _arr2[_i8];
      App.contracts.RariFundManager.methods.isCurrencyAccepted(currencyCode).call().then(function (accepted) {
        $('#DepositToken > option[value="' + currencyCode + '"]').text(currencyCode + (accepted ? " (no slippage)" : ""));
      });
    };

    for (var _i8 = 0, _arr2 = ["DAI", "USDC", "USDT"]; _i8 < _arr2.length; _i8++) {
      _loop2();
    }
  },
  getDirectlyWithdrawableCurrencies: function getDirectlyWithdrawableCurrencies() {
    var _loop3 = function _loop3() {
      var currencyCode = _arr3[_i9];
      App.contracts.RariFundManager.methods["getRawFundBalance(string)"](currencyCode).call().then(function (rawFundBalance) {
        $('#WithdrawToken > option[value="' + currencyCode + '"]').text(currencyCode + (parseFloat(rawFundBalance) > 0 ? " (no slippage up to " + (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals) >= 10 ? (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals)).toFixed(2) : (parseFloat(rawFundBalance) / Math.pow(10, App.tokens[currencyCode].decimals)).toPrecision(4)) + ")" : ""));
      });
    };

    for (var _i9 = 0, _arr3 = ["DAI", "USDC", "USDT"]; _i9 < _arr3.length; _i9++) {
      _loop3();
    }
  },

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
        App.getMyInterestAccrued();
        if (!App.intervalGetMyInterestAccrued) App.intervalGetMyInterestAccrued = setInterval(App.getMyInterestAccrued, 5 * 60 * 1000);
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
                if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount: " + err, "Internal error");
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

  /**
   * Deposit funds to the stablecoin fund.
   */
  handleDeposit: function () {
    var _handleDeposit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(event) {
      var token, amount, amountBN, accountBalanceBN;
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              event.preventDefault();
              token = $('#DepositToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context11.next = 4;
                break;
              }

              return _context11.abrupt("return", toastr["error"]("Invalid token!", "Deposit failed"));

            case 4:
              amount = parseFloat($('#DepositAmount').val());

              if (!(!amount || amount <= 0)) {
                _context11.next = 7;
                break;
              }

              return _context11.abrupt("return", toastr["error"]("Deposit amount must be greater than 0!", "Deposit failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              _context11.t0 = Web3.utils;
              _context11.next = 11;
              return token == "ETH" ? App.web3.eth.getBalance(App.selectedAccount) : App.tokens[token].contract.methods.balanceOf(App.selectedAccount).call();

            case 11:
              _context11.t1 = _context11.sent;
              accountBalanceBN = _context11.t0.toBN.call(_context11.t0, _context11.t1);

              if (!amountBN.gt(accountBalanceBN)) {
                _context11.next = 15;
                break;
              }

              return _context11.abrupt("return", toastr["error"]("Not enough balance in your account to make a deposit of this amount. Current account balance: " + new Big(accountBalanceBN.toString()).div(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toString() + " " + token, "Deposit failed"));

            case 15:
              $('#depositButton, #confirmDepositButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context11.next = 18;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
                var accepted, myFundBalanceBN, depositContract, allowanceBN, receipt, acceptedCurrency, _yield$App$get0xSwapO, _yield$App$get0xSwapO2, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, amountOutputted, epochNow, slippage, slippageAbsPercentageString, signatures, j;

                return regeneratorRuntime.wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        App.getDirectlyDepositableCurrencies();

                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context10.next = 7;
                          break;
                        }

                        _context10.next = 4;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted(token).call();

                      case 4:
                        _context10.t0 = _context10.sent;
                        _context10.next = 8;
                        break;

                      case 7:
                        _context10.t0 = false;

                      case 8:
                        accepted = _context10.t0;

                        if (!accepted) {
                          _context10.next = 46;
                          break;
                        }

                        if ($('#modal-confirm-deposit').is(':visible')) $('#modal-confirm-deposit').modal('hide');
                        _context10.t1 = Web3.utils;
                        _context10.next = 14;
                        return App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call();

                      case 14:
                        _context10.t2 = _context10.sent;
                        myFundBalanceBN = _context10.t1.toBN.call(_context10.t1, _context10.t2);

                        if (!(App.checkAccountBalanceLimit && myFundBalanceBN.add(amountBN.mul(Web3.utils.toBN(10).pow(Web3.utils.toBN(18 - App.tokens[token].decimals)))).gt(Web3.utils.toBN(350e18)))) {
                          _context10.next = 18;
                          break;
                        }

                        return _context10.abrupt("return", toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed"));

                      case 18:
                        console.log('Deposit ' + amount + ' ' + token + ' directly');
                        depositContract = amount >= 250 && myFundBalanceBN.isZero() ? App.contractsGsn.RariFundProxy : App.contracts.RariFundManager; // Approve tokens to RariFundManager

                        _context10.prev = 20;
                        _context10.t3 = Web3.utils;
                        _context10.next = 24;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, depositContract.options.address).call();

                      case 24:
                        _context10.t4 = _context10.sent;
                        allowanceBN = _context10.t3.toBN.call(_context10.t3, _context10.t4);

                        if (!allowanceBN.lt(amountBN)) {
                          _context10.next = 29;
                          break;
                        }

                        _context10.next = 29;
                        return App.tokens[token].contract.methods.approve(depositContract.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 29:
                        _context10.next = 34;
                        break;

                      case 31:
                        _context10.prev = 31;
                        _context10.t5 = _context10["catch"](20);
                        return _context10.abrupt("return", toastr["error"]("Failed to approve tokens: " + (_context10.t5.message ? _context10.t5.message : _context10.t5), "Deposit failed"));

                      case 34:
                        _context10.prev = 34;
                        _context10.next = 37;
                        return depositContract.methods.deposit(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 37:
                        receipt = _context10.sent;
                        _context10.next = 43;
                        break;

                      case 40:
                        _context10.prev = 40;
                        _context10.t6 = _context10["catch"](34);
                        return _context10.abrupt("return", toastr["error"](_context10.t6.message ? _context10.t6.message : _context10.t6, "Deposit failed"));

                      case 43:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct deposit", {
                          transactionHash: receipt.transactionHash,
                          currencyCode: token,
                          amount: amount
                        });
                        _context10.next = 157;
                        break;

                      case 46:
                        // Get accepted currency
                        acceptedCurrency = null;
                        _context10.t7 = token !== "DAI";

                        if (!_context10.t7) {
                          _context10.next = 52;
                          break;
                        }

                        _context10.next = 51;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("DAI").call();

                      case 51:
                        _context10.t7 = _context10.sent;

                      case 52:
                        if (!_context10.t7) {
                          _context10.next = 56;
                          break;
                        }

                        acceptedCurrency = "DAI";
                        _context10.next = 72;
                        break;

                      case 56:
                        _context10.t8 = token !== "USDC";

                        if (!_context10.t8) {
                          _context10.next = 61;
                          break;
                        }

                        _context10.next = 60;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDC").call();

                      case 60:
                        _context10.t8 = _context10.sent;

                      case 61:
                        if (!_context10.t8) {
                          _context10.next = 65;
                          break;
                        }

                        acceptedCurrency = "USDC";
                        _context10.next = 72;
                        break;

                      case 65:
                        _context10.t9 = token !== "USDT";

                        if (!_context10.t9) {
                          _context10.next = 70;
                          break;
                        }

                        _context10.next = 69;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDT").call();

                      case 69:
                        _context10.t9 = _context10.sent;

                      case 70:
                        if (!_context10.t9) {
                          _context10.next = 72;
                          break;
                        }

                        acceptedCurrency = "USDT";

                      case 72:
                        if (!(acceptedCurrency === null)) {
                          _context10.next = 74;
                          break;
                        }

                        return _context10.abrupt("return", toastr["error"]("No accepted currencies found.", "Deposit failed"));

                      case 74:
                        _context10.prev = 74;
                        _context10.next = 77;
                        return App.get0xSwapOrders(token === "ETH" ? "WETH" : App.tokens[token].address, App.tokens[acceptedCurrency].address, amountBN);

                      case 77:
                        _yield$App$get0xSwapO = _context10.sent;
                        _yield$App$get0xSwapO2 = _slicedToArray(_yield$App$get0xSwapO, 6);
                        orders = _yield$App$get0xSwapO2[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO2[1];
                        protocolFee = _yield$App$get0xSwapO2[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO2[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO2[4];
                        gasPrice = _yield$App$get0xSwapO2[5];
                        _context10.next = 90;
                        break;

                      case 87:
                        _context10.prev = 87;
                        _context10.t10 = _context10["catch"](74);
                        return _context10.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context10.t10, "Deposit failed"));

                      case 90:
                        if (!App.checkAccountBalanceLimit) {
                          _context10.next = 98;
                          break;
                        }

                        _context10.t11 = Web3.utils;
                        _context10.next = 94;
                        return App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call();

                      case 94:
                        _context10.t12 = _context10.sent;
                        myFundBalanceBN = _context10.t11.toBN.call(_context10.t11, _context10.t12);

                        if (!myFundBalanceBN.add(makerAssetFilledAmountBN.mul(Web3.utils.toBN(10).pow(Web3.utils.toBN(18 - App.tokens[acceptedCurrency].decimals)))).gt(Web3.utils.toBN(350e18))) {
                          _context10.next = 98;
                          break;
                        }

                        return _context10.abrupt("return", toastr["error"]("Making a deposit of this amount would cause your account balance to exceed the limit of $350 USD.", "Deposit failed"));

                      case 98:
                        amountOutputted = makerAssetFilledAmountBN.toString() / Math.pow(10, App.tokens[acceptedCurrency].decimals); // Make sure input amount is completely filled

                        if (!inputFilledAmountBN.lt(amountBN)) {
                          _context10.next = 102;
                          break;
                        }

                        $('#DepositAmount').val(inputFilledAmountBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals));
                        return _context10.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange " + token + " before depositing.", "Deposit canceled"));

                      case 102:
                        // Warn user of slippage
                        epochNow = new Date().getTime();

                        if (!(!App.zeroExPrices[token === "ETH" ? "WETH" : token] || epochNow > App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated + 60 * 1000)) {
                          _context10.next = 114;
                          break;
                        }

                        _context10.prev = 104;
                        _context10.next = 107;
                        return App.get0xPrices(token === "ETH" ? "WETH" : token);

                      case 107:
                        App.zeroExPrices[token === "ETH" ? "WETH" : token] = _context10.sent;
                        _context10.next = 113;
                        break;

                      case 110:
                        _context10.prev = 110;
                        _context10.t13 = _context10["catch"](104);
                        return _context10.abrupt("return", toastr["error"]("Failed to get prices from 0x swap API: " + _context10.t13, "Deposit failed"));

                      case 113:
                        App.zeroExPrices[token === "ETH" ? "WETH" : token]._lastUpdated = epochNow;

                      case 114:
                        if (App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency]) {
                          _context10.next = 116;
                          break;
                        }

                        return _context10.abrupt("return", toastr["error"]("Price not found on 0x swap API", "Deposit failed"));

                      case 116:
                        slippage = 1 - amountOutputted / amount * App.zeroExPrices[token === "ETH" ? "WETH" : token][acceptedCurrency];
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#modal-confirm-deposit').is(':visible')) {
                          _context10.next = 122;
                          break;
                        }

                        $('#DepositExchangeFee kbd').html(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context10.abrupt("return", $('#modal-confirm-deposit').modal('show'));

                      case 122:
                        if (!($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context10.next = 125;
                          break;
                        }

                        $('#DepositSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context10.abrupt("return", toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to process your deposit.", "Please try again"));

                      case 125:
                        if (!($('#DepositExchangeFee kbd').html().substring(0, $('#DepositExchangeFee kbd').html().indexOf("<") - 1) !== protocolFee / 1e18 + " ETH")) {
                          _context10.next = 128;
                          break;
                        }

                        $('#DepositExchangeFee kbd').html(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        return _context10.abrupt("return", toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to process your deposit.", "Please try again"));

                      case 128:
                        console.log('Exchange ' + amount + ' ' + token + ' to deposit ' + amountOutputted + ' ' + acceptedCurrency); // Approve tokens to RariFundProxy if token is not ETH

                        if (!(token !== "ETH")) {
                          _context10.next = 144;
                          break;
                        }

                        _context10.prev = 130;
                        _context10.t14 = Web3.utils;
                        _context10.next = 134;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call();

                      case 134:
                        _context10.t15 = _context10.sent;
                        allowanceBN = _context10.t14.toBN.call(_context10.t14, _context10.t15);

                        if (!allowanceBN.lt(amountBN)) {
                          _context10.next = 139;
                          break;
                        }

                        _context10.next = 139;
                        return App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 139:
                        _context10.next = 144;
                        break;

                      case 141:
                        _context10.prev = 141;
                        _context10.t16 = _context10["catch"](130);
                        return _context10.abrupt("return", toastr["error"]("Failed to approve tokens to RariFundProxy: " + (_context10.t16.message ? _context10.t16.message : _context10.t16), "Deposit failed"));

                      case 144:
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


                        _context10.prev = 146;
                        _context10.next = 149;
                        return App.contracts.RariFundProxy.methods.exchangeAndDeposit(token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN, acceptedCurrency, orders, signatures, takerAssetFilledAmountBN).send({
                          from: App.selectedAccount,
                          value: token === "ETH" ? Web3.utils.toBN(protocolFee).add(amountBN).toString() : protocolFee,
                          gasPrice: gasPrice
                        });

                      case 149:
                        receipt = _context10.sent;
                        _context10.next = 155;
                        break;

                      case 152:
                        _context10.prev = 152;
                        _context10.t17 = _context10["catch"](146);
                        return _context10.abrupt("return", toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + (_context10.t17.message ? _context10.t17.message : _context10.t17), "Deposit failed"));

                      case 155:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Exchange and deposit", {
                          transactionHash: receipt.transactionHash,
                          inputCurrencyCode: token,
                          inputAmount: amount,
                          outputCurrencyCode: acceptedCurrency,
                          outputAmount: amountOutputted
                        }); // Hide old slippage after exchange success

                        $('#modal-confirm-deposit').modal('hide');

                      case 157:
                        // Alert success and refresh balances
                        toastr["success"]("Deposit of " + amount + " " + token + " confirmed!", "Deposit successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 165:
                      case "end":
                        return _context10.stop();
                    }
                  }
                }, _callee10, null, [[20, 31], [34, 40], [74, 87], [104, 110], [130, 141], [146, 152]]);
              }))();

            case 18:
              $('#depositButton').text("Deposit");
              $('#confirmDepositButton').text("Confirm");
              $('#depositButton, #confirmDepositButton').prop("disabled", false);

            case 21:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11);
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
    var _handleWithdraw = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(event) {
      var token, amount, amountBN;
      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              event.preventDefault();
              token = $('#WithdrawToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context13.next = 4;
                break;
              }

              return _context13.abrupt("return", toastr["error"]("Invalid token!", "Withdrawal failed"));

            case 4:
              amount = parseFloat($('#WithdrawAmount').val());

              if (!(!amount || amount <= 0)) {
                _context13.next = 7;
                break;
              }

              return _context13.abrupt("return", toastr["error"]("Withdrawal amount must be greater than 0!", "Withdrawal failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", true).html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context13.next = 11;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
                var allowanceBN, tokenRawFundBalanceBN, receipt, inputCurrencyCodes, inputAmountBNs, allOrders, allSignatures, makerAssetFillAmountBNs, protocolFeeBNs, amountInputtedUsdBN, amountWithdrawnBN, totalProtocolFeeBN, inputCandidates, _i10, _arr4, inputToken, rawFundBalanceBN, i, _yield$App$get0xSwapO3, _yield$App$get0xSwapO4, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, signatures, j, thisOutputAmountBN, thisInputAmountBN, tries, epochNow, amountOutputtedUsd, slippage, slippageAbsPercentageString, inputAmountStrings, makerAssetFillAmountStrings, protocolFeeStrings, inputs;

                return regeneratorRuntime.wrap(function _callee12$(_context12) {
                  while (1) {
                    switch (_context12.prev = _context12.next) {
                      case 0:
                        App.getDirectlyWithdrawableCurrencies(); // Approve RFT to RariFundManager

                        _context12.prev = 1;
                        _context12.t0 = Web3.utils;
                        _context12.next = 5;
                        return App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call();

                      case 5:
                        _context12.t1 = _context12.sent;
                        allowanceBN = _context12.t0.toBN.call(_context12.t0, _context12.t1);

                        if (!allowanceBN.lt(Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1))) {
                          _context12.next = 10;
                          break;
                        }

                        _context12.next = 10;
                        return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1)).send({
                          from: App.selectedAccount
                        });

                      case 10:
                        _context12.next = 15;
                        break;

                      case 12:
                        _context12.prev = 12;
                        _context12.t2 = _context12["catch"](1);
                        return _context12.abrupt("return", toastr["error"]("Failed to approve RFT to RariFundManager: " + (_context12.t2.message ? _context12.t2.message : _context12.t2), "Withdrawal failed"));

                      case 15:
                        // See how much we can withdraw directly if token is not ETH
                        tokenRawFundBalanceBN = Web3.utils.toBN(0);

                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context12.next = 28;
                          break;
                        }

                        _context12.prev = 17;
                        _context12.t3 = Web3.utils;
                        _context12.next = 21;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](token).call();

                      case 21:
                        _context12.t4 = _context12.sent;
                        tokenRawFundBalanceBN = _context12.t3.toBN.call(_context12.t3, _context12.t4);
                        _context12.next = 28;
                        break;

                      case 25:
                        _context12.prev = 25;
                        _context12.t5 = _context12["catch"](17);
                        return _context12.abrupt("return", toastr["error"]("Failed to get raw fund balance of output currency: " + _context12.t5, "Withdrawal failed"));

                      case 28:
                        if (!tokenRawFundBalanceBN.gte(amountBN)) {
                          _context12.next = 43;
                          break;
                        }

                        // If we can withdraw everything directly, do so
                        if ($('#modal-confirm-withdrawal').is(':visible')) $('#modal-confirm-withdrawal').modal('hide');
                        console.log('Withdraw ' + amountBN + ' of ' + amount + ' ' + token + ' directly');
                        _context12.prev = 31;
                        _context12.next = 34;
                        return App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 34:
                        receipt = _context12.sent;
                        _context12.next = 40;
                        break;

                      case 37:
                        _context12.prev = 37;
                        _context12.t6 = _context12["catch"](31);
                        return _context12.abrupt("return", toastr["error"]("RariFundManager.withdraw failed: " + (_context12.t6.message ? _context12.t6.message : _context12.t6), "Withdrawal failed"));

                      case 40:
                        // Mixpanel
                        if (typeof mixpanel !== 'undefined') mixpanel.track("Direct withdrawal", {
                          transactionHash: receipt.transactionHash,
                          currencyCode: token,
                          amount: amount
                        });
                        _context12.next = 184;
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
                        _i10 = 0, _arr4 = ["DAI", "USDC", "USDT"];

                      case 55:
                        if (!(_i10 < _arr4.length)) {
                          _context12.next = 67;
                          break;
                        }

                        inputToken = _arr4[_i10];

                        if (!(inputToken !== token)) {
                          _context12.next = 64;
                          break;
                        }

                        _context12.t7 = Web3.utils;
                        _context12.next = 61;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](inputToken).call();

                      case 61:
                        _context12.t8 = _context12.sent;
                        rawFundBalanceBN = _context12.t7.toBN.call(_context12.t7, _context12.t8);
                        if (rawFundBalanceBN.gt(Web3.utils.toBN(0))) inputCandidates.push({
                          currencyCode: inputToken,
                          rawFundBalanceBN: rawFundBalanceBN
                        });

                      case 64:
                        _i10++;
                        _context12.next = 55;
                        break;

                      case 67:
                        i = 0;

                      case 68:
                        if (!(i < inputCandidates.length)) {
                          _context12.next = 96;
                          break;
                        }

                        _context12.prev = 69;
                        _context12.next = 72;
                        return App.get0xSwapOrders(App.tokens[inputCandidates[i].currencyCode].address, token === "ETH" ? "WETH" : App.tokens[token].address, inputCandidates[i].rawFundBalanceBN, amountBN);

                      case 72:
                        _yield$App$get0xSwapO3 = _context12.sent;
                        _yield$App$get0xSwapO4 = _slicedToArray(_yield$App$get0xSwapO3, 6);
                        orders = _yield$App$get0xSwapO4[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO4[1];
                        protocolFee = _yield$App$get0xSwapO4[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO4[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO4[4];
                        gasPrice = _yield$App$get0xSwapO4[5];
                        _context12.next = 85;
                        break;

                      case 82:
                        _context12.prev = 82;
                        _context12.t9 = _context12["catch"](69);
                        return _context12.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context12.t9, "Withdrawal failed"));

                      case 85:
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

                      case 93:
                        i++;
                        _context12.next = 68;
                        break;

                      case 96:
                        // Sort candidates from lowest to highest takerAssetFillAmount
                        inputCandidates.sort(function (a, b) {
                          return a.makerAssetFillAmountBN.gt(b.makerAssetFillAmountBN) ? 1 : -1;
                        }); // Loop through input currency candidates until we fill the withdrawal

                        i = 0;

                      case 98:
                        if (!(i < inputCandidates.length)) {
                          _context12.next = 126;
                          break;
                        }

                        if (!inputCandidates[i].makerAssetFillAmountBN.gte(amountBN.sub(amountWithdrawnBN))) {
                          _context12.next = 120;
                          break;
                        }

                        thisOutputAmountBN = amountBN.sub(amountWithdrawnBN);
                        thisInputAmountBN = inputCandidates[i].inputFillAmountBN.mul(thisOutputAmountBN).div(inputCandidates[i].makerAssetFillAmountBN);
                        tries = 0;

                      case 103:
                        if (!inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).lt(thisOutputAmountBN)) {
                          _context12.next = 110;
                          break;
                        }

                        if (!(tries >= 1000)) {
                          _context12.next = 106;
                          break;
                        }

                        return _context12.abrupt("return", toastr["error"]("Failed to get increment order input amount to achieve desired output amount: " + err, "Withdrawal failed"));

                      case 106:
                        thisInputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount

                        tries++;
                        _context12.next = 103;
                        break;

                      case 110:
                        inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                        inputAmountBNs.push(thisInputAmountBN);
                        allOrders.push(inputCandidates[i].orders);
                        allSignatures.push(inputCandidates[i].signatures);
                        makerAssetFillAmountBNs.push(thisOutputAmountBN);
                        protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        amountInputtedUsdBN.iadd(thisInputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, App.tokens[inputCandidates[i].currencyCode].decimals))));
                        amountWithdrawnBN.iadd(thisOutputAmountBN);
                        totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        return _context12.abrupt("break", 126);

                      case 120:
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
                          _context12.next = 123;
                          break;
                        }

                        return _context12.abrupt("break", 126);

                      case 123:
                        i++;
                        _context12.next = 98;
                        break;

                      case 126:
                        if (!amountWithdrawnBN.lt(amountBN)) {
                          _context12.next = 129;
                          break;
                        }

                        $('#WithdrawAmount').val(amountWithdrawnBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals));
                        return _context12.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange withdrawn tokens to " + token + ".", "Withdrawal canceled"));

                      case 129:
                        // Warn user of slippage
                        epochNow = new Date().getTime();

                        if (!(!App.zeroExPrices["DAI"] || epochNow > App.zeroExPrices["DAI"]._lastUpdated + 60 * 1000)) {
                          _context12.next = 141;
                          break;
                        }

                        _context12.prev = 131;
                        _context12.next = 134;
                        return App.get0xPrices("DAI");

                      case 134:
                        App.zeroExPrices["DAI"] = _context12.sent;
                        _context12.next = 140;
                        break;

                      case 137:
                        _context12.prev = 137;
                        _context12.t10 = _context12["catch"](131);
                        return _context12.abrupt("return", toastr["error"]("Failed to get prices from 0x swap API: " + _context12.t10, "Deposit failed"));

                      case 140:
                        App.zeroExPrices["DAI"]._lastUpdated = epochNow;

                      case 141:
                        if (App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]) {
                          _context12.next = 143;
                          break;
                        }

                        return _context12.abrupt("return", toastr["error"]("Price not found on 0x swap API", "Deposit failed"));

                      case 143:
                        amountOutputtedUsd = amount * App.zeroExPrices["DAI"][token === "ETH" ? "WETH" : token]; // TODO: Use actual input currencies instead of using DAI for USD price

                        slippage = 1 - amountOutputtedUsd / (amountInputtedUsdBN.toString() / 1e18);
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#modal-confirm-withdrawal').is(':visible')) {
                          _context12.next = 150;
                          break;
                        }

                        $('#WithdrawExchangeFee kbd').text(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context12.abrupt("return", $('#modal-confirm-withdrawal').modal('show'));

                      case 150:
                        if (!($('#WithdrawSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context12.next = 153;
                          break;
                        }

                        $('#WithdrawSlippage').html(slippage >= 0 ? '<strong>Slippage:</strong> <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "warning") + '">' + slippageAbsPercentageString + '%</kbd>' : '<strong>Bonus:</strong> <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>');
                        return _context12.abrupt("return", toastr["warning"]("Exchange slippage changed. If you are satisfied with the new slippage, please click the \"Confirm\" button again to make your withdrawal.", "Please try again"));

                      case 153:
                        if (!($('#WithdrawExchangeFee kbd').html().substring(0, $('#WithdrawExchangeFee kbd').html().indexOf("<") - 1) !== protocolFee / 1e18 + " ETH")) {
                          _context12.next = 156;
                          break;
                        }

                        $('#WithdrawExchangeFee kbd').text(protocolFee / 1e18 + ' ETH <small>($' + (protocolFee / 1e18 * App.usdPrices["ETH"]).toFixed(2) + ' USD)</small>');
                        return _context12.abrupt("return", toastr["warning"]("Exchange fee changed. If you are satisfied with the new fee, please click the \"Confirm\" button again to make your withdrawal.", "Please try again"));

                      case 156:
                        console.log('Withdraw and exchange to ' + amountWithdrawnBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals) + ' ' + token); // Withdraw and exchange tokens via RariFundProxy

                        _context12.prev = 157;
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

                        _context12.t11 = App.contracts.RariFundProxy.methods.withdrawAndExchange(inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
                        _context12.t12 = App.selectedAccount;
                        _context12.t13 = totalProtocolFeeBN;
                        _context12.t14 = gasPrice;
                        _context12.next = 170;
                        return App.web3.eth.getTransactionCount(App.selectedAccount);

                      case 170:
                        _context12.t15 = _context12.sent;
                        _context12.t16 = {
                          from: _context12.t12,
                          value: _context12.t13,
                          gasPrice: _context12.t14,
                          nonce: _context12.t15
                        };
                        _context12.next = 174;
                        return _context12.t11.send.call(_context12.t11, _context12.t16);

                      case 174:
                        receipt = _context12.sent;
                        _context12.next = 180;
                        break;

                      case 177:
                        _context12.prev = 177;
                        _context12.t17 = _context12["catch"](157);
                        return _context12.abrupt("return", toastr["error"]("RariFundProxy.withdrawAndExchange failed: " + (_context12.t17.message ? _context12.t17.message : _context12.t17), "Withdrawal failed"));

                      case 180:
                        // Mixpanel
                        inputs = [];

                        for (i = 0; i < inputCurrencyCodes.length; i++) {
                          inputs.push({
                            currencyCode: inputCurrencyCodes[i],
                            amount: inputAmountBNs[i].toString() / Math.pow(10, App.tokens[inputCurrencyCodes[i]].decimals)
                          });
                        }

                        if (typeof mixpanel !== 'undefined') mixpanel.track("Withdraw and exchange", {
                          transactionHash: receipt.transactionHash,
                          inputs: inputs,
                          outputCurrencyCode: token,
                          outputAmount: amount
                        }); // Hide old slippage after exchange success

                        $('#modal-confirm-withdrawal').modal('hide');

                      case 184:
                        // Alert success and refresh balances
                        toastr["success"]("Withdrawal of " + amount + " " + token + " confirmed!", "Withdrawal successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 192:
                      case "end":
                        return _context12.stop();
                    }
                  }
                }, _callee12, null, [[1, 12], [17, 25], [31, 37], [69, 82], [131, 137], [157, 177]]);
              }))();

            case 11:
              $('#withdrawButton').text("Withdraw");
              $('#confirmWithdrawalButton').text("Confirm");
              $('#withdrawButton, #confirmWithdrawalButton').prop("disabled", false);

            case 14:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13);
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
  getMyInterestAccrued: function getMyInterestAccrued() {
    console.log('Getting my interest accrued...');
    App.contracts.RariFundManager.methods.interestAccruedBy(App.selectedAccount).call().then(function (result) {
      $('#MyInterestAccrued').text(new Big(result).div(new Big(10).pow(18)).toFormat());
    }).catch(function (err) {
      console.error(err);
    });
  },

  /**
   * Transfer RariFundToken.
   */
  handleTransfer: function () {
    var _handleTransfer = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(event) {
      var currency, amount, amountBN, toAddress;
      return regeneratorRuntime.wrap(function _callee15$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              event.preventDefault();
              currency = $('#TransferCurrency').val();

              if (!(["USD", "RFT"].indexOf(currency) < 0)) {
                _context15.next = 4;
                break;
              }

              return _context15.abrupt("return", toastr["error"]("Invalid currency!", "Transfer failed"));

            case 4:
              amount = parseFloat($('#TransferAmount').val());

              if (!(!amount || amount <= 0)) {
                _context15.next = 7;
                break;
              }

              return _context15.abrupt("return", toastr["error"]("Transfer amount must be greater than 0!", "Transfer failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(18)).toFixed());
              toAddress = $('#TransferAddress').val();

              if (toAddress) {
                _context15.next = 11;
                break;
              }

              return _context15.abrupt("return", toastr["error"]("You must enter a destination address!", "Transfer failed"));

            case 11:
              $('#transferButton').prop("disabled", true);
              $('#transferButton').html('<div class="loading-icon"><div></div><div></div><div></div></div>');
              _context15.next = 15;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14() {
                var amountBN;
                return regeneratorRuntime.wrap(function _callee14$(_context14) {
                  while (1) {
                    switch (_context14.prev = _context14.next) {
                      case 0:
                        console.log('Transfer ' + amount + ' ' + currency + ' to ' + toAddress);
                        amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(18)).toFixed());
                        _context14.prev = 2;
                        _context14.next = 5;
                        return App.contracts.RariFundToken.methods.transfer(toAddress, rftAmountBN).send({
                          from: App.selectedAccount
                        });

                      case 5:
                        _context14.next = 10;
                        break;

                      case 7:
                        _context14.prev = 7;
                        _context14.t0 = _context14["catch"](2);
                        return _context14.abrupt("return", toastr["error"](_context14.t0, "Transfer failed"));

                      case 10:
                        toastr["success"]("Transfer of " + (currency === "USD" ? "$" : "") + amount + " " + currency + " confirmed!", "Transfer successful");
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();

                      case 15:
                      case "end":
                        return _context14.stop();
                    }
                  }
                }, _callee14, null, [[2, 7]]);
              }))();

            case 15:
              $('#transferButton').text("Transfer");
              $('#transferButton').prop("disabled", false);

            case 17:
            case "end":
              return _context15.stop();
          }
        }
      }, _callee15);
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
      $('#RFTBalance').text(new Big(result).div(new Big(10).pow(18)).toFormat());
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

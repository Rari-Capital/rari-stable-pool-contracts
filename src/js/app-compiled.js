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
var Authereum = window.Authereum;
App = {
  web3: null,
  web3Modal: null,
  web3Provider: null,
  accounts: [],
  selectedAccount: null,
  contracts: {},
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
  init: function init() {
    if (location.hash === "#account") {
      $('#container-fund').hide();
      $('#container-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    }

    $('#tab-fund').click(function () {
      $('#container-account').hide();
      $('#container-fund').show();
      $('#tab-account').css('text-decoration', '');
      $('#tab-fund').css('text-decoration', 'underline');
    });
    $('#tab-account').click(function () {
      $('#container-fund').hide();
      $('#container-account').show();
      $('#tab-fund').css('text-decoration', '');
      $('#tab-account').css('text-decoration', 'underline');
    });
    App.initChartColors();
    App.initAprChart();
    App.initWeb3();
    App.bindEvents();
  },
  initChartColors: function initChartColors() {
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
              contractBalanceUsdBN = contractBalanceBN.mul(Web3.utils.toBN(currencyCode === "DAI" ? 1e18 : 1e6)); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

              factors.push([contractBalanceUsdBN, Web3.utils.toBN(0)]);
              totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN);
              _context.next = 21;
              return App.contracts.RariFundController.methods.getPoolBalances(currencyCode).call();

            case 21:
              poolBalances = _context.sent;

              for (i = 0; i < poolBalances["0"].length; i++) {
                poolBalanceBN = Web3.utils.toBN(poolBalances["1"][i]);
                poolBalanceUsdBN = poolBalanceBN.mul(Web3.utils.toBN(currencyCode === "DAI" ? 1e18 : 1e6)); // TODO: Factor in prices; for now we assume the value of all supported currencies = $1

                apyBN = poolBalances["0"][i] == 1 ? compoundApyBNs[currencyCode] : dydxApyBNs[currencyCode];
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
    var _getCompoundApyBNs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(currencyCode) {
      var data, apyBNs, i;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return $.getJSON("https://api.compound.finance/api/v2/ctoken");

            case 2:
              data = _context3.sent;
              apyBNs = {};

              for (i = 0; i < data.cToken.length; i++) {
                if (["DAI", "USDC", "USDT"].indexOf(data.cToken[i].underlying_symbol) >= 0) apyBNs[data.cToken[i].underlying_symbol] = Web3.utils.toBN(Math.trunc(parseFloat(data.cToken[i].supply_rate.value) * 1e18));
              }

              return _context3.abrupt("return", apyBNs);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    function getCompoundApyBNs(_x) {
      return _getCompoundApyBNs.apply(this, arguments);
    }

    return getCompoundApyBNs;
  }(),
  initAprChart: function initAprChart() {
    var compoundData = {};
    var dydxData = {};
    var epoch = Math.floor(new Date().getTime() / 1000);
    var epochOneYearAgo = epoch - 86400 * 365;
    Promise.all([$.getJSON("dydx-aprs.json"), $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0x5d3a536e4d6dbd6114cc1ead35777bab948e3643&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365"), $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0x39AA39c021dfbaE8faC545936693aC917d5E7563&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365"), $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365")]).then(function (values) {
      var ourData = {};
      var dydxAvgs = [];
      var epochs = Object.keys(values[0]).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for dYdX graph and max for our graph
        var sum = 0;
        var max = 0;

        for (var _i2 = 0, _Object$keys = Object.keys(values[0][epochs[i]]); _i2 < _Object$keys.length; _i2++) {
          var currencyCode = _Object$keys[_i2];
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

      for (var i = 0; i < values[1].supply_rates.length; i++) {
        var rateEpoch = values[1].supply_rates[i].block_timestamp * 1000;
        if (compoundData[rateEpoch] === undefined) compoundData[rateEpoch] = [];
        compoundData[rateEpoch].push(values[1].supply_rates[i].rate);
      }

      for (var i = 0; i < values[2].supply_rates.length; i++) {
        var rateEpoch = values[2].supply_rates[i].block_timestamp * 1000;
        if (compoundData[rateEpoch] === undefined) compoundData[rateEpoch] = [];
        compoundData[rateEpoch].push(values[2].supply_rates[i].rate);
      }

      for (var i = 0; i < values[3].supply_rates.length; i++) {
        var rateEpoch = values[3].supply_rates[i].block_timestamp * 1000;
        if (compoundData[rateEpoch] === undefined) compoundData[rateEpoch] = [];
        compoundData[rateEpoch].push(values[3].supply_rates[i].rate);
      }

      var compoundAvgs = [];
      var epochs = Object.keys(compoundData).sort();

      for (var i = 0; i < epochs.length; i++) {
        // Calculate average for Compound graph and max for our graph
        var sum = 0;
        var max = 0;

        for (var j = 0; j < compoundData[epochs[i]].length; j++) {
          sum += compoundData[epochs[i]][j];
          if (compoundData[epochs[i]][j] > max) max = compoundData[epochs[i]][j];
        }

        var avg = sum / compoundData[epochs[i]].length;
        compoundAvgs.push({
          t: new Date(parseInt(epochs[i])),
          y: avg * 100
        }); // Add data for Rari graph

        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || max > ourData[flooredEpoch]) ourData[flooredEpoch] = max;
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
              }
            }],
            yAxes: [{
              gridLines: {
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
              }
            }],
            yAxes: [{
              gridLines: {
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
          key: "pk_live_F95FEECB1BE324B5" // TODO: Replace API key

        }
      },
      torus: {
        package: Torus,
        options: {}
      },
      portis: {
        package: Portis,
        options: {
          id: "7e4ce7f9-7cd0-42da-a634-44e682aacd73" // TODO: Replace API key

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
    var _fetchAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
      var chainId, _i3, _Object$keys2, symbol, _i4, _Object$keys3, _symbol, i;

      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              // Get a Web3 instance for the wallet
              App.web3 = new Web3(App.web3Provider); // Get connected chain ID from Ethereum node

              _context4.next = 3;
              return App.web3.eth.getChainId();

            case 3:
              chainId = _context4.sent;
              _context4.next = 6;
              return App.web3.eth.getAccounts();

            case 6:
              App.accounts = _context4.sent;
              App.selectedAccount = App.accounts[0]; // Refresh contracts to use new Web3

              for (_i3 = 0, _Object$keys2 = Object.keys(App.contracts); _i3 < _Object$keys2.length; _i3++) {
                symbol = _Object$keys2[_i3];
                App.contracts[symbol] = new App.web3.eth.Contract(App.contracts[symbol].options.jsonInterface, App.contracts[symbol].options.address);
              }

              for (_i4 = 0, _Object$keys3 = Object.keys(App.tokens); _i4 < _Object$keys3.length; _i4++) {
                _symbol = _Object$keys3[_i4];
                if (App.tokens[_symbol].contract) App.tokens[_symbol].contract = new App.web3.eth.Contract(App.tokens[_symbol].contract.options.jsonInterface, App.tokens[_symbol].address);
              } // Get user's account balance in the quant fund and RFT balance


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

            case 15:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
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
    var _refreshAccountData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
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
              _context5.next = 5;
              return App.fetchAccountData();

            case 5:
              $(".btn-connect").hide();
              $(".btn-connect").text("Connect");
              $(".btn-connect").prop("disabled", false);
              $("#btn-disconnect").show();
              $("#selected-account").show();
              $('#container-fund').hide();
              $('#container-account').show();
              $('#tab-fund').css('text-decoration', '');
              $('#tab-account').css('text-decoration', 'underline');

            case 14:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
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
    var _connectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              // Setting this null forces to show the dialogue every time
              // regardless if we play around with a cacheProvider settings
              // in our localhost.
              // TODO: A clean API needed here
              App.web3Modal.providerController.cachedProvider = null;
              _context6.prev = 1;
              _context6.next = 4;
              return App.web3Modal.connect();

            case 4:
              App.web3Provider = _context6.sent;
              _context6.next = 11;
              break;

            case 7:
              _context6.prev = 7;
              _context6.t0 = _context6["catch"](1);
              console.error("Could not get a wallet connection", _context6.t0);
              return _context6.abrupt("return");

            case 11:
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
              _context6.next = 16;
              return App.refreshAccountData();

            case 16:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, null, [[1, 7]]);
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
    var _disconnectWallet = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              console.log("Killing the wallet connection", App.web3Provider); // TODO: MetamaskInpageProvider does not provide disconnect?

              if (!App.web3Provider.close) {
                _context7.next = 5;
                break;
              }

              _context7.next = 4;
              return App.web3Provider.close();

            case 4:
              App.web3Provider = null;

            case 5:
              App.selectedAccount = null; // Set the UI back to the initial state

              $("#selected-account").empty();
              $("#selected-account").hide();
              $("#btn-disconnect").hide();
              $(".btn-connect").show();
              $('#MyUSDBalance').text("?");
              $('#RFTBalance').text("?");
              $('#MyInterestAccrued').text("?");

            case 13:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
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
    $.getJSON('abi/RariFundController.json', function (data) {
      App.contracts.RariFundController = new App.web3.eth.Contract(data, "0x8D16aca4A9A47299D373CEd4a2A9cB889C5a357B");
      /* App.getCurrentApy();
      setInterval(App.getCurrentApy, 5 * 60 * 1000); */
    });
    $.getJSON('abi/RariFundManager.json', function (data) {
      App.contracts.RariFundManager = new App.web3.eth.Contract(data, "0x2af1325281Ec17F7Bac733F14D2AC04EFBfA2Fc6");
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
    $.getJSON('abi/RariFundToken.json', function (data) {
      App.contracts.RariFundToken = new App.web3.eth.Contract(data, "0x9366B7C00894c3555c7590b0384e5F6a9D55659f");

      if (App.selectedAccount) {
        App.getTokenBalance();
        if (!App.intervalGetTokenBalance) App.intervalGetTokenBalance = setInterval(App.getTokenBalance, 5 * 60 * 1000);
      }
    });
    $.getJSON('abi/RariFundProxy.json', function (data) {
      App.contracts.RariFundProxy = new App.web3.eth.Contract(data, "0x5C9c17BF585e05d8A54Ea0D4B30fbDB3Aa13d38b");
    });
    $.getJSON('abi/ERC20.json', function (data) {
      App.erc20Abi = data;

      for (var _i5 = 0, _Object$keys4 = Object.keys(App.tokens); _i5 < _Object$keys4.length; _i5++) {
        var symbol = _Object$keys4[_i5];
        App.tokens[symbol].contract = new App.web3.eth.Contract(data, App.tokens[symbol].address);
      }
    });
    $.getJSON('https://api.0x.org/swap/v0/tokens', function (data) {
      data.records.sort(function (a, b) {
        return a.symbol > b.symbol ? 1 : -1;
      });

      var _iterator = _createForOfIteratorHelper(data.records),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var token = _step.value;
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
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    });
  },
  getDirectlyDepositableCurrencies: function getDirectlyDepositableCurrencies() {
    var _loop = function _loop() {
      var currencyCode = _arr2[_i6];
      App.contracts.RariFundManager.methods.isCurrencyAccepted(currencyCode).call().then(function (accepted) {
        $('#DepositToken > option[value="' + currencyCode + '"]').text(currencyCode + (accepted ? " (no slippage)" : ""));
      });
    };

    for (var _i6 = 0, _arr2 = ["DAI", "USDC", "USDT"]; _i6 < _arr2.length; _i6++) {
      _loop();
    }
  },
  getDirectlyWithdrawableCurrencies: function getDirectlyWithdrawableCurrencies() {
    var _loop2 = function _loop2() {
      var currencyCode = _arr3[_i7];
      App.contracts.RariFundManager.methods["getRawFundBalance(string)"](currencyCode).call().then(function (rawFundBalance) {
        $('#WithdrawToken > option[value="' + currencyCode + '"]').text(currencyCode + (parseFloat(rawFundBalance) > 0 ? " (no slippage up to " + (parseFloat(rawFundBalance) / (currencyCode === "DAI" ? 1e18 : 1e6)).toPrecision(4) + ")" : ""));
      });
    };

    for (var _i7 = 0, _arr3 = ["DAI", "USDC", "USDT"]; _i7 < _arr3.length; _i7++) {
      _loop2();
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
      App.selectedAccount = $(this).val(); // Get user's account balance in the quant fund and RFT balance

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
    $(document).on('change', '#DepositAmount', function () {
      $('#DepositSlippage').hide();
    });
    $(document).on('click', '#depositButton', App.handleDeposit);
    $(document).on('change', '#WithdrawAmount', function () {
      $('#WithdrawSlippage').hide();
    });
    $(document).on('click', '#withdrawButton', App.handleWithdraw);
    $(document).on('click', '#transferButton', App.handleTransfer);
  },
  get0xPrice: function get0xPrice(inputTokenSymbol, outputTokenSymbol) {
    return new Promise(function (resolve, reject) {
      $.getJSON('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, function (decoded) {
        if (!decoded) reject("Failed to decode prices from 0x swap API");
        if (!decoded.records) reject("No prices found on 0x swap API");

        for (var i = 0; i < decoded.records.length; i++) {
          if (decoded.records[i].symbol === outputTokenSymbol) resolve(decoded.records[i].price);
        }

        reject("Price not found on 0x swap API");
      }).fail(function (err) {
        reject("Error requesting prices from 0x swap API: " + err.message);
      });
    });
  },
  get0xSwapOrders: function get0xSwapOrders(inputTokenAddress, outputTokenAddress, maxInputAmountBN, maxMakerAssetFillAmountBN) {
    return new Promise(function (resolve, reject) {
      $.getJSON('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + (maxMakerAssetFillAmountBN !== undefined ? '&buyAmount=' + maxMakerAssetFillAmountBN.toString() : '&sellAmount=' + maxInputAmountBN.toString()), function (decoded) {
        if (!decoded) reject("Failed to decode quote from 0x swap API");
        if (!decoded.orders) reject("No orders found on 0x swap API");
        decoded.orders.sort(function (a, b) {
          return a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee) ? 1 : -1;
        });
        var orders = [];
        var inputFilledAmountBN = Web3.utils.toBN(0);
        var takerAssetFilledAmountBN = Web3.utils.toBN(0);
        var makerAssetFilledAmountBN = Web3.utils.toBN(0);

        for (var i = 0; i < decoded.orders.length; i++) {
          if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData !== "0xf47261b0000000000000000000000000" + inputTokenAddress) continue;
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
              console.log(orderMakerAssetFillAmountBN.toString(), orderInputFillAmountBN.toString(), makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).toString());
              var tries = 0;

              while (makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).lt(orderMakerAssetFillAmountBN)) {
                if (tries >= 1000) return toastr["error"]("Failed to get increment order input amount to achieve desired output amount: " + err, "Withdrawal failed");
                orderInputFillAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount

                tries++;
              }

              console.log(orderMakerAssetFillAmountBN.toString(), orderInputFillAmountBN.toString(), makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).toString());
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

        if (takerAssetFilledAmountBN.isZero()) reject("No orders found on 0x swap API");
        resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, decoded.gasPrice]);
      }).fail(function (err) {
        reject("Error requesting quote from 0x swap API: " + err.message);
      });
    });
  },

  /**
   * Deposit funds to the quant fund.
   */
  handleDeposit: function () {
    var _handleDeposit = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(event) {
      var token, amount, amountBN, accountBalanceBN;
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              event.preventDefault();
              token = $('#DepositToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context9.next = 4;
                break;
              }

              return _context9.abrupt("return", toastr["error"]("Invalid token!", "Deposit failed"));

            case 4:
              amount = parseFloat($('#DepositAmount').val());

              if (!(amount <= 0)) {
                _context9.next = 7;
                break;
              }

              return _context9.abrupt("return", toastr["error"]("Amount must be greater than 0!", "Deposit failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              _context9.t0 = Web3.utils;
              _context9.next = 11;
              return token == "ETH" ? App.web3.eth.getBalance(App.selectedAccount) : App.tokens[token].contract.methods.balanceOf(App.selectedAccount).call();

            case 11:
              _context9.t1 = _context9.sent;
              accountBalanceBN = _context9.t0.toBN.call(_context9.t0, _context9.t1);

              if (!amountBN.gt(accountBalanceBN)) {
                _context9.next = 15;
                break;
              }

              return _context9.abrupt("return", toastr["error"]("Not enough balance in your account to make a deposit of this amount. Current account balance: " + new Big(accountBalanceBN.toString()).div(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toString() + " " + token, "Deposit failed"));

            case 15:
              $('#depositButton').prop("disabled", true);
              $('#depositButton').text("...");
              _context9.next = 19;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
                var accepted, allowanceBN, acceptedCurrency, _yield$App$get0xSwapO, _yield$App$get0xSwapO2, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, amountInputtedUsd, amountOutputtedUsd, slippage, slippageAbsPercentageString, signatures, j;

                return regeneratorRuntime.wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        App.getDirectlyDepositableCurrencies();

                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context8.next = 7;
                          break;
                        }

                        _context8.next = 4;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted(token).call();

                      case 4:
                        _context8.t0 = _context8.sent;
                        _context8.next = 8;
                        break;

                      case 7:
                        _context8.t0 = false;

                      case 8:
                        accepted = _context8.t0;

                        if (!accepted) {
                          _context8.next = 36;
                          break;
                        }

                        $('#DepositSlippage').hide();
                        console.log('Deposit ' + amount + ' ' + token + ' directly'); // Approve tokens to RariFundManager

                        _context8.prev = 12;
                        _context8.t1 = Web3.utils;
                        _context8.next = 16;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call();

                      case 16:
                        _context8.t2 = _context8.sent;
                        allowanceBN = _context8.t1.toBN.call(_context8.t1, _context8.t2);

                        if (!allowanceBN.lt(amountBN)) {
                          _context8.next = 21;
                          break;
                        }

                        _context8.next = 21;
                        return App.tokens[token].contract.methods.approve(App.contracts.RariFundManager.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 21:
                        _context8.next = 26;
                        break;

                      case 23:
                        _context8.prev = 23;
                        _context8.t3 = _context8["catch"](12);
                        return _context8.abrupt("return", toastr["error"]("Failed to approve tokens to RariFundManager: " + _context8.t3, "Deposit failed"));

                      case 26:
                        _context8.prev = 26;
                        _context8.next = 29;
                        return App.contracts.RariFundManager.methods.deposit(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 29:
                        _context8.next = 34;
                        break;

                      case 31:
                        _context8.prev = 31;
                        _context8.t4 = _context8["catch"](26);
                        return _context8.abrupt("return", toastr["error"](_context8.t4.message ? _context8.t4.message : _context8.t4, "Deposit failed"));

                      case 34:
                        _context8.next = 123;
                        break;

                      case 36:
                        // Get accepted currency
                        acceptedCurrency = null;
                        _context8.t5 = token !== "DAI";

                        if (!_context8.t5) {
                          _context8.next = 42;
                          break;
                        }

                        _context8.next = 41;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("DAI").call();

                      case 41:
                        _context8.t5 = _context8.sent;

                      case 42:
                        if (!_context8.t5) {
                          _context8.next = 46;
                          break;
                        }

                        acceptedCurrency = "DAI";
                        _context8.next = 62;
                        break;

                      case 46:
                        _context8.t6 = token !== "USDC";

                        if (!_context8.t6) {
                          _context8.next = 51;
                          break;
                        }

                        _context8.next = 50;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDC").call();

                      case 50:
                        _context8.t6 = _context8.sent;

                      case 51:
                        if (!_context8.t6) {
                          _context8.next = 55;
                          break;
                        }

                        acceptedCurrency = "USDC";
                        _context8.next = 62;
                        break;

                      case 55:
                        _context8.t7 = token !== "USDT";

                        if (!_context8.t7) {
                          _context8.next = 60;
                          break;
                        }

                        _context8.next = 59;
                        return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDT").call();

                      case 59:
                        _context8.t7 = _context8.sent;

                      case 60:
                        if (!_context8.t7) {
                          _context8.next = 62;
                          break;
                        }

                        acceptedCurrency = "USDT";

                      case 62:
                        if (!(acceptedCurrency === null)) {
                          _context8.next = 64;
                          break;
                        }

                        return _context8.abrupt("return", toastr["error"]("No accepted currencies found.", "Deposit failed"));

                      case 64:
                        _context8.prev = 64;
                        _context8.next = 67;
                        return App.get0xSwapOrders(token === "ETH" ? "WETH" : App.tokens[token].address, App.tokens[acceptedCurrency].address, amountBN);

                      case 67:
                        _yield$App$get0xSwapO = _context8.sent;
                        _yield$App$get0xSwapO2 = _slicedToArray(_yield$App$get0xSwapO, 6);
                        orders = _yield$App$get0xSwapO2[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO2[1];
                        protocolFee = _yield$App$get0xSwapO2[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO2[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO2[4];
                        gasPrice = _yield$App$get0xSwapO2[5];
                        _context8.next = 80;
                        break;

                      case 77:
                        _context8.prev = 77;
                        _context8.t8 = _context8["catch"](64);
                        return _context8.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context8.t8, "Deposit failed"));

                      case 80:
                        if (!inputFilledAmountBN.lt(amountBN)) {
                          _context8.next = 83;
                          break;
                        }

                        $('#DepositAmount').val(inputFilledAmountBN.toString() / Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals));
                        return _context8.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange " + token + " before depositing.", "Deposit canceled"));

                      case 83:
                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context8.next = 87;
                          break;
                        }

                        _context8.t9 = amount;
                        _context8.next = 92;
                        break;

                      case 87:
                        _context8.t10 = amount;
                        _context8.next = 90;
                        return App.get0xPrice(token === "ETH" ? "WETH" : token, acceptedCurrency);

                      case 90:
                        _context8.t11 = _context8.sent;
                        _context8.t9 = _context8.t10 / _context8.t11;

                      case 92:
                        amountInputtedUsd = _context8.t9;
                        amountOutputtedUsd = makerAssetFilledAmountBN.toString() / Math.pow(10, App.tokens[acceptedCurrency].decimals);
                        slippage = 1 - amountOutputtedUsd / amountInputtedUsd;
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#DepositSlippage').is(':visible')) {
                          _context8.next = 99;
                          break;
                        }

                        $('#DepositSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "danger") + '">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
                        return _context8.abrupt("return", toastr["warning"]("Please note the exchange slippage required to make a deposit of this currency.", "Deposit canceled"));

                      case 99:
                        if (!($('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context8.next = 102;
                          break;
                        }

                        $('#DepositSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "danger") + '">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
                        return _context8.abrupt("return", toastr["warning"]("Exchange slippage changed.", "Deposit canceled"));

                      case 102:
                        console.log('Exchange ' + amount + ' ' + token + ' to deposit ' + acceptedCurrency); // Approve tokens to RariFundProxy if token is not ETH

                        if (!(token !== "ETH")) {
                          _context8.next = 112;
                          break;
                        }

                        _context8.t12 = Web3.utils;
                        _context8.next = 107;
                        return App.tokens[token].contract.methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call();

                      case 107:
                        _context8.t13 = _context8.sent;
                        allowanceBN = _context8.t12.toBN.call(_context8.t12, _context8.t13);

                        if (!allowanceBN.lt(amountBN)) {
                          _context8.next = 112;
                          break;
                        }

                        _context8.next = 112;
                        return App.tokens[token].contract.methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 112:
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


                        _context8.prev = 114;
                        _context8.next = 117;
                        return App.contracts.RariFundProxy.methods.exchangeAndDeposit(token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, amountBN, acceptedCurrency, orders, signatures, takerAssetFilledAmountBN).send({
                          from: App.selectedAccount,
                          value: token === "ETH" ? Web3.utils.toBN(protocolFee).add(amountBN).toString() : protocolFee,
                          gasPrice: gasPrice
                        });

                      case 117:
                        _context8.next = 122;
                        break;

                      case 119:
                        _context8.prev = 119;
                        _context8.t14 = _context8["catch"](114);
                        return _context8.abrupt("return", toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + _context8.t14, "Deposit failed"));

                      case 122:
                        // Hide old slippage after exchange success
                        $('#DepositSlippage').hide();

                      case 123:
                        // Alert success and refresh balances
                        toastr["success"]("Deposit of " + amount + " " + token + " confirmed!", "Deposit successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 131:
                      case "end":
                        return _context8.stop();
                    }
                  }
                }, _callee8, null, [[12, 23], [26, 31], [64, 77], [114, 119]]);
              }))();

            case 19:
              $('#depositButton').text("Deposit");
              $('#depositButton').prop("disabled", false);

            case 21:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));

    function handleDeposit(_x2) {
      return _handleDeposit.apply(this, arguments);
    }

    return handleDeposit;
  }(),

  /**
   * Withdraw funds from the quant fund.
   */
  handleWithdraw: function () {
    var _handleWithdraw = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(event) {
      var token, amount, amountBN;
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              event.preventDefault();
              token = $('#WithdrawToken').val();

              if (!(token !== "ETH" && !App.tokens[token])) {
                _context11.next = 4;
                break;
              }

              return _context11.abrupt("return", toastr["error"]("Invalid token!", "Withdrawal failed"));

            case 4:
              amount = parseFloat($('#WithdrawAmount').val());

              if (!(amount <= 0)) {
                _context11.next = 7;
                break;
              }

              return _context11.abrupt("return", toastr["error"]("Amount must be greater than 0!", "Withdrawal failed"));

            case 7:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(token == "ETH" ? 18 : App.tokens[token].decimals)).toFixed());
              $('#withdrawButton').prop("disabled", true);
              $('#withdrawButton').text("...");
              _context11.next = 12;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
                var allowanceBN, tokenRawFundBalanceBN, inputCurrencyCodes, inputAmountBNs, allOrders, allSignatures, makerAssetFillAmountBNs, protocolFeeBNs, amountInputtedUsdBN, amountWithdrawnBN, totalProtocolFeeBN, inputCandidates, _i8, _arr4, inputToken, rawFundBalanceBN, i, _yield$App$get0xSwapO3, _yield$App$get0xSwapO4, orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN, gasPrice, signatures, j, thisOutputAmountBN, thisInputAmountBN, tries, amountOutputtedUsd, slippage, slippageAbsPercentageString, inputAmountStrings, makerAssetFillAmountStrings, protocolFeeStrings;

                return regeneratorRuntime.wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        App.getDirectlyWithdrawableCurrencies(); // Approve RFT to RariFundManager

                        _context10.prev = 1;
                        _context10.t0 = Web3.utils;
                        _context10.next = 5;
                        return App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call();

                      case 5:
                        _context10.t1 = _context10.sent;
                        allowanceBN = _context10.t0.toBN.call(_context10.t0, _context10.t1);

                        if (!allowanceBN.lt(Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1))) {
                          _context10.next = 10;
                          break;
                        }

                        _context10.next = 10;
                        return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1)).send({
                          from: App.selectedAccount
                        });

                      case 10:
                        _context10.next = 15;
                        break;

                      case 12:
                        _context10.prev = 12;
                        _context10.t2 = _context10["catch"](1);
                        return _context10.abrupt("return", toastr["error"]("Failed to approve RFT to RariFundManager: " + _context10.t2, "Withdrawal failed"));

                      case 15:
                        // See how much we can withdraw directly if token is not ETH
                        tokenRawFundBalanceBN = Web3.utils.toBN(0);

                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context10.next = 28;
                          break;
                        }

                        _context10.prev = 17;
                        _context10.t3 = Web3.utils;
                        _context10.next = 21;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](token).call();

                      case 21:
                        _context10.t4 = _context10.sent;
                        tokenRawFundBalanceBN = _context10.t3.toBN.call(_context10.t3, _context10.t4);
                        _context10.next = 28;
                        break;

                      case 25:
                        _context10.prev = 25;
                        _context10.t5 = _context10["catch"](17);
                        return _context10.abrupt("return", toastr["error"]("Failed to get raw fund balance of output currency: " + _context10.t5, "Withdrawal failed"));

                      case 28:
                        if (!tokenRawFundBalanceBN.gte(amountBN)) {
                          _context10.next = 35;
                          break;
                        }

                        // If we can withdraw everything directly, do so
                        $('#WithdrawSlippage').hide();
                        console.log('Withdraw ' + amountBN + ' of ' + amount + ' ' + token + ' directly');
                        _context10.next = 33;
                        return App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 33:
                        _context10.next = 176;
                        break;

                      case 35:
                        // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
                        inputCurrencyCodes = [];
                        inputAmountBNs = [];
                        allOrders = [];
                        allSignatures = [];
                        makerAssetFillAmountBNs = [];
                        protocolFeeBNs = [];
                        amountInputtedUsdBN = Web3.utils.toBN(0);
                        amountWithdrawnBN = Web3.utils.toBN(0);
                        totalProtocolFeeBN = Web3.utils.toBN(0); // Get input candidates

                        inputCandidates = [];
                        _i8 = 0, _arr4 = ["DAI", "USDC", "USDT"];

                      case 46:
                        if (!(_i8 < _arr4.length)) {
                          _context10.next = 68;
                          break;
                        }

                        inputToken = _arr4[_i8];

                        if (!(inputToken === token && tokenRawFundBalanceBN.gt(Web3.utils.toBN(0)))) {
                          _context10.next = 59;
                          break;
                        }

                        // Withdraw as much as we can of the output token first
                        inputCurrencyCodes.push(token);
                        inputAmountBNs.push(tokenRawFundBalanceBN);
                        allOrders.push([]);
                        allSignatures.push([]);
                        makerAssetFillAmountBNs.push(0);
                        protocolFeeBNs.push(0);
                        amountInputtedUsdBN.iadd(tokenRawFundBalanceBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(Math.pow(10, token == "ETH" ? 18 : App.tokens[token].decimals))));
                        amountWithdrawnBN.iadd(tokenRawFundBalanceBN);
                        _context10.next = 65;
                        break;

                      case 59:
                        _context10.t6 = Web3.utils;
                        _context10.next = 62;
                        return App.contracts.RariFundManager.methods["getRawFundBalance(string)"](inputToken).call();

                      case 62:
                        _context10.t7 = _context10.sent;
                        rawFundBalanceBN = _context10.t6.toBN.call(_context10.t6, _context10.t7);
                        if (rawFundBalanceBN.gt(Web3.utils.toBN(0))) inputCandidates.push({
                          currencyCode: inputToken,
                          rawFundBalanceBN: rawFundBalanceBN
                        });

                      case 65:
                        _i8++;
                        _context10.next = 46;
                        break;

                      case 68:
                        i = 0;

                      case 69:
                        if (!(i < inputCandidates.length)) {
                          _context10.next = 97;
                          break;
                        }

                        _context10.prev = 70;
                        _context10.next = 73;
                        return App.get0xSwapOrders(App.tokens[inputCandidates[i].currencyCode].address, token === "ETH" ? "WETH" : App.tokens[token].address, inputCandidates[i].rawFundBalanceBN, amountBN);

                      case 73:
                        _yield$App$get0xSwapO3 = _context10.sent;
                        _yield$App$get0xSwapO4 = _slicedToArray(_yield$App$get0xSwapO3, 6);
                        orders = _yield$App$get0xSwapO4[0];
                        inputFilledAmountBN = _yield$App$get0xSwapO4[1];
                        protocolFee = _yield$App$get0xSwapO4[2];
                        takerAssetFilledAmountBN = _yield$App$get0xSwapO4[3];
                        makerAssetFilledAmountBN = _yield$App$get0xSwapO4[4];
                        gasPrice = _yield$App$get0xSwapO4[5];
                        _context10.next = 86;
                        break;

                      case 83:
                        _context10.prev = 83;
                        _context10.t8 = _context10["catch"](70);
                        return _context10.abrupt("return", toastr["error"]("Failed to get swap orders from 0x API: " + _context10.t8, "Withdrawal failed"));

                      case 86:
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

                      case 94:
                        i++;
                        _context10.next = 69;
                        break;

                      case 97:
                        // Sort candidates from lowest to highest takerAssetFillAmount
                        inputCandidates.sort(function (a, b) {
                          return a.makerAssetFillAmountBN.gt(b.makerAssetFillAmountBN) ? 1 : -1;
                        });
                        console.log(inputCandidates); // Loop through input currency candidates until we fill the withdrawal

                        i = 0;

                      case 100:
                        if (!(i < inputCandidates.length)) {
                          _context10.next = 130;
                          break;
                        }

                        if (!inputCandidates[i].makerAssetFillAmountBN.gte(amountBN.sub(amountWithdrawnBN))) {
                          _context10.next = 124;
                          break;
                        }

                        thisOutputAmountBN = amountBN.sub(amountWithdrawnBN);
                        thisInputAmountBN = inputCandidates[i].inputFillAmountBN.mul(thisOutputAmountBN).div(inputCandidates[i].makerAssetFillAmountBN);
                        console.log(thisOutputAmountBN.toString(), thisInputAmountBN.toString(), inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).toString());
                        tries = 0;

                      case 106:
                        if (!inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).lt(thisOutputAmountBN)) {
                          _context10.next = 113;
                          break;
                        }

                        if (!(tries >= 1000)) {
                          _context10.next = 109;
                          break;
                        }

                        return _context10.abrupt("return", toastr["error"]("Failed to get increment order input amount to achieve desired output amount: " + err, "Withdrawal failed"));

                      case 109:
                        thisInputAmountBN.iadd(Web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount

                        tries++;
                        _context10.next = 106;
                        break;

                      case 113:
                        console.log(thisOutputAmountBN.toString(), thisInputAmountBN.toString(), inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).toString());
                        inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                        inputAmountBNs.push(thisInputAmountBN);
                        allOrders.push(inputCandidates[i].orders);
                        allSignatures.push(inputCandidates[i].signatures);
                        makerAssetFillAmountBNs.push(thisOutputAmountBN);
                        protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        amountInputtedUsdBN.iadd(thisInputAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(inputCandidates[i].currencyCode === "DAI" ? 1e18 : 1e6)));
                        amountWithdrawnBN.iadd(thisOutputAmountBN);
                        totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));
                        return _context10.abrupt("break", 130);

                      case 124:
                        // Add all that we can of the last one, then go through them again
                        if (i == inputCandidates.length - 1) {
                          inputCurrencyCodes.push(inputCandidates[i].currencyCode);
                          inputAmountBNs.push(inputCandidates[i].inputFillAmountBN);
                          allOrders.push(inputCandidates[i].orders);
                          allSignatures.push(inputCandidates[i].signatures);
                          makerAssetFillAmountBNs.push(inputCandidates[i].makerAssetFillAmountBN);
                          protocolFeeBNs.push(Web3.utils.toBN(inputCandidates[i].protocolFee));
                          amountInputtedUsdBN.iadd(inputCandidates[i].inputFillAmountBN.mul(Web3.utils.toBN(1e18)).div(Web3.utils.toBN(inputCandidates[i].currencyCode === "DAI" ? 1e18 : 1e6)));
                          amountWithdrawnBN.iadd(inputCandidates[i].makerAssetFillAmountBN);
                          totalProtocolFeeBN.iadd(Web3.utils.toBN(inputCandidates[i].protocolFee));
                          i = -1;
                          inputCandidates.pop();
                        } // Stop if we have filled the withdrawal


                        if (!amountWithdrawnBN.gte(amountBN)) {
                          _context10.next = 127;
                          break;
                        }

                        return _context10.abrupt("break", 130);

                      case 127:
                        i++;
                        _context10.next = 100;
                        break;

                      case 130:
                        if (!amountWithdrawnBN.lt(amountBN)) {
                          _context10.next = 133;
                          break;
                        }

                        $('#WithdrawAmount').val(amountWithdrawnBN.toString() / (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6));
                        return _context10.abrupt("return", toastr["warning"]("Unable to find enough liquidity to exchange withdrawn tokens to " + token + ".", "Withdrawal canceled"));

                      case 133:
                        if (!(["DAI", "USDC", "USDT"].indexOf(token) >= 0)) {
                          _context10.next = 137;
                          break;
                        }

                        _context10.t9 = amount;
                        _context10.next = 142;
                        break;

                      case 137:
                        _context10.t10 = amount;
                        _context10.next = 140;
                        return App.get0xPrice("DAI", token === "ETH" ? "WETH" : token);

                      case 140:
                        _context10.t11 = _context10.sent;
                        _context10.t9 = _context10.t10 * _context10.t11;

                      case 142:
                        amountOutputtedUsd = _context10.t9;
                        // TODO: Use actual input currencies instead of using DAI for USD price
                        slippage = 1 - amountOutputtedUsd / (amountInputtedUsdBN.toString() / 1e18);
                        slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

                        if ($('#WithdrawSlippage').is(':visible')) {
                          _context10.next = 148;
                          break;
                        }

                        $('#WithdrawSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "danger") + '">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
                        return _context10.abrupt("return", toastr["warning"]("Please note the exchange slippage required to make a withdrawal of this currency.", "Withdrawal canceled"));

                      case 148:
                        if (!($('#WithdrawSlippage kbd').text() !== slippageAbsPercentageString + "%")) {
                          _context10.next = 151;
                          break;
                        }

                        $('#WithdrawSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-' + (slippageAbsPercentageString === "0.000" ? "info" : "danger") + '">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
                        return _context10.abrupt("return", toastr["warning"]("Exchange slippage changed.", "Withdrawal canceled"));

                      case 151:
                        console.log('Withdraw and exchange to ' + amountWithdrawnBN.toString() / (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6) + ' ' + token); // Withdraw and exchange tokens via RariFundProxy

                        _context10.prev = 152;
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

                        console.log(inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "ETH" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
                        _context10.t12 = App.contracts.RariFundProxy.methods.withdrawAndExchange(inputCurrencyCodes, inputAmountStrings, token === "ETH" ? "0x0000000000000000000000000000000000000000" : App.tokens[token].address, allOrders, allSignatures, makerAssetFillAmountStrings, protocolFeeStrings);
                        _context10.t13 = App.selectedAccount;
                        _context10.t14 = totalProtocolFeeBN;
                        _context10.t15 = gasPrice;
                        _context10.next = 166;
                        return App.web3.eth.getTransactionCount(App.selectedAccount);

                      case 166:
                        _context10.t16 = _context10.sent;
                        _context10.t17 = {
                          from: _context10.t13,
                          value: _context10.t14,
                          gasPrice: _context10.t15,
                          nonce: _context10.t16
                        };
                        _context10.next = 170;
                        return _context10.t12.send.call(_context10.t12, _context10.t17);

                      case 170:
                        _context10.next = 175;
                        break;

                      case 172:
                        _context10.prev = 172;
                        _context10.t18 = _context10["catch"](152);
                        return _context10.abrupt("return", toastr["error"]("RariFundProxy.withdrawAndExchange failed: " + _context10.t18, "Withdrawal failed"));

                      case 175:
                        // Hide old slippage after exchange success
                        $('#WithdrawSlippage').hide();

                      case 176:
                        // Alert success and refresh balances
                        toastr["success"]("Withdrawal of " + amount + " " + token + " confirmed!", "Withdrawal successful");
                        $('#USDBalance').text("?");
                        App.getFundBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        App.getDirectlyWithdrawableCurrencies();

                      case 184:
                      case "end":
                        return _context10.stop();
                    }
                  }
                }, _callee10, null, [[1, 12], [17, 25], [70, 83], [152, 172]]);
              }))();

            case 12:
              $('#withdrawButton').text("Withdraw");
              $('#withdrawButton').prop("disabled", false);

            case 14:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11);
    }));

    function handleWithdraw(_x3) {
      return _handleWithdraw.apply(this, arguments);
    }

    return handleWithdraw;
  }(),

  /**
   * Get the total balance of the quant fund in USD.
   */
  getFundBalance: function getFundBalance() {
    console.log('Getting fund balance...');
    App.contracts.RariFundManager.methods.getFundBalance().call().then(function (result) {
      $('#USDBalance').text(new Big(result).div(new Big(10).pow(18)).toFixed(8));
    }).catch(function (err) {
      console.error(err);
    });
  },

  /**
   * Get the user's account balance in the quant fund in USD.
   */
  getMyFundBalance: function getMyFundBalance() {
    console.log('Getting my fund balance...');
    App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call().then(function (result) {
      $('#MyUSDBalance').text(new Big(result).div(new Big(10).pow(18)).toString());
    }).catch(function (err) {
      console.error(err);
    });
  },

  /**
   * Get the user's interest accrued in the quant fund in USD.
   */
  getMyInterestAccrued: function getMyInterestAccrued() {
    console.log('Getting my interest accrued...');
    App.contracts.RariFundManager.methods.interestAccruedBy(App.selectedAccount).call().then(function (result) {
      $('#MyInterestAccrued').text(new Big(result).div(new Big(10).pow(18)).toString());
    }).catch(function (err) {
      console.error(err);
    });
  },

  /**
   * Transfer RariFundToken.
   */
  handleTransfer: function () {
    var _handleTransfer = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(event) {
      var amount, amountBN, toAddress;
      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              event.preventDefault();
              amount = parseFloat($('#RFTTransferAmount').val());

              if (!(amount <= 0)) {
                _context13.next = 4;
                break;
              }

              return _context13.abrupt("return", toastr["error"]("Amount must be greater than 0!", "Transfer failed"));

            case 4:
              amountBN = Web3.utils.toBN(new Big(amount).mul(new Big(10).pow(18)).toFixed());
              toAddress = $('#RFTTransferAddress').val();
              $('#transferButton').prop("disabled", true);
              $('#transferButton').text("...");
              _context13.next = 10;
              return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
                return regeneratorRuntime.wrap(function _callee12$(_context12) {
                  while (1) {
                    switch (_context12.prev = _context12.next) {
                      case 0:
                        console.log('Transfer ' + amount + ' RFT to ' + toAddress);
                        _context12.prev = 1;
                        _context12.next = 4;
                        return App.contracts.RariFundToken.methods.transfer(toAddress, amountBN).send({
                          from: App.selectedAccount
                        });

                      case 4:
                        _context12.next = 9;
                        break;

                      case 6:
                        _context12.prev = 6;
                        _context12.t0 = _context12["catch"](1);
                        return _context12.abrupt("return", toastr["error"](_context12.t0, "Transfer failed"));

                      case 9:
                        toastr["success"]("Transfer of " + amount + " RFT confirmed!", "Transfer successful");
                        $('#RFTBalance').text("?");
                        App.getTokenBalance();
                        $('#MyUSDBalance').text("?");
                        App.getMyFundBalance();

                      case 14:
                      case "end":
                        return _context12.stop();
                    }
                  }
                }, _callee12, null, [[1, 6]]);
              }))();

            case 10:
              $('#transferButton').text("Transfer");
              $('#transferButton').prop("disabled", false);

            case 12:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13);
    }));

    function handleTransfer(_x4) {
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
      $('#RFTBalance').text(new Big(result).div(new Big(10).pow(18)).toString());
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

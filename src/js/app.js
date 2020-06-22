// Unpackage imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.EvmChains;
const Fortmatic = window.Fortmatic;
const Torus = window.Torus;
const Portis = window.Portis;
const Authereum = window.Authereum;

App = {
  web3: null,
  web3Modal: null,
  web3Provider: null,
  accounts: [],
  selectedAccount: null,
  contracts: {},

  init: function() {
    App.initChartColors();
    App.initAprChart();
    App.initWeb3();
    App.bindEvents();
  },

  initChartColors: function() {
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

  initAprChart: function() {
    var compoundData = {};
    var dydxData = {};
    var epoch = Math.floor((new Date()).getTime() / 1000);
    var epochOneYearAgo = epoch - (86400 * 365);

    Promise.all([
      $.getJSON("dydx-aprs.json"),
      $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0x5d3a536e4d6dbd6114cc1ead35777bab948e3643&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365"),
      $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0x39AA39c021dfbaE8faC545936693aC917d5E7563&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365"),
      $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365")
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

        var avg =  sum / compoundData[epochs[i]].length;
        compoundAvgs.push({ t: new Date(parseInt(epochs[i])), y: avg * 100 });

        // Add data for Rari graph
        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        if (ourData[flooredEpoch] === undefined || max > ourData[flooredEpoch]) ourData[flooredEpoch] = max;
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
              distribution: 'series',
              offset: true,
              ticks: {
                major: {
                  enabled: true,
                  fontStyle: 'bold'
                },
                source: 'data',
                autoSkip: true,
                autoSkipPadding: 75,
                maxRotation: 0,
                sampleSize: 100
              },
              afterBuildTicks: function(scale, ticks) {
                var majorUnit = scale._majorUnit;
                var firstTick = ticks[0];
                var i, ilen, val, tick, currMajor, lastMajor;

                val = moment(ticks[0].value);
                if ((majorUnit === 'minute' && val.second() === 0)
                    || (majorUnit === 'hour' && val.minute() === 0)
                    || (majorUnit === 'day' && val.hour() === 9)
                    || (majorUnit === 'month' && val.date() <= 3 && val.isoWeekday() === 1)
                    || (majorUnit === 'year' && val.month() === 0)) {
                  firstTick.major = true;
                } else {
                  firstTick.major = false;
                }
                lastMajor = val.get(majorUnit);

                for (i = 1, ilen = ticks.length; i < ilen; i++) {
                  tick = ticks[i];
                  val = moment(tick.value);
                  currMajor = val.get(majorUnit);
                  tick.major = currMajor !== lastMajor;
                  lastMajor = currMajor;
                }
                return ticks;
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
      var ourReturns = [];
      currentReturn = 10000;
      for (var i = 0; i < ourAvgs.length; i++) ourReturns.push({ t: ourAvgs[i].t, y: currentReturn *= (1 + (ourAvgs[i].y / 100) / 365) });

      // Init chart
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
              distribution: 'series',
              offset: true,
              ticks: {
                major: {
                  enabled: true,
                  fontStyle: 'bold'
                },
                source: 'data',
                autoSkip: true,
                autoSkipPadding: 75,
                maxRotation: 0,
                sampleSize: 100
              },
              afterBuildTicks: function(scale, ticks) {
                var majorUnit = scale._majorUnit;
                var firstTick = ticks[0];
                var i, ilen, val, tick, currMajor, lastMajor;

                val = moment(ticks[0].value);
                if ((majorUnit === 'minute' && val.second() === 0)
                    || (majorUnit === 'hour' && val.minute() === 0)
                    || (majorUnit === 'day' && val.hour() === 9)
                    || (majorUnit === 'month' && val.date() <= 3 && val.isoWeekday() === 1)
                    || (majorUnit === 'year' && val.month() === 0)) {
                  firstTick.major = true;
                } else {
                  firstTick.major = false;
                }
                lastMajor = val.get(majorUnit);

                for (i = 1, ilen = ticks.length; i < ilen; i++) {
                  tick = ticks[i];
                  val = moment(tick.value);
                  currMajor = val.get(majorUnit);
                  tick.major = currMajor !== lastMajor;
                  lastMajor = currMajor;
                }
                return ticks;
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
              label: function(tooltipItem, myData) {
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

    // Get user's account balance in the quant fund and RFT balance
    if (App.contracts.RariFundManager) App.getMyFundBalance();
    if (App.contracts.RariFundToken) App.getTokenBalance();
  
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
    $("#MyDAIBalance, #MyUSDCBalance, #MyUSDTBalance, #RFTBalance").text("?");
  
    // Disable button while UI is loading.
    // fetchAccountData() will take a while as it communicates
    // with Ethereum node via JSON-RPC and loads chain data
    // over an API call.
    $("#btn-connect").text("Loading...");
    $("#btn-connect").prop("disabled", true);
    await App.fetchAccountData();
    $("#btn-connect").hide();
    $("#btn-connect").text("Connect");
    $("#btn-connect").prop("disabled", false);
    $("#btn-disconnect").show();
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
  
    await App.refreshAccountData();
  },
  
  /**
   * Disconnect wallet button pressed.
   */
  disconnectWallet: async function() {
    console.log("Killing the wallet connection", provider);
  
    // TODO: MetamaskInpageProvider does not provide disconnect?
    if (provider.close) {
      await provider.close();
      provider = null;
    }
  
    selectedAccount = null;
  
    // Set the UI back to the initial state
    $("#selected-account").empty();
    $("#btn-disconnect").hide();
    $("#btn-connect").show();
  },
  
  /**
   * Initialize the latest version of web3.js (MetaMask uses an oudated one that overwrites ours if we include it as an HTML tag), then initialize and connect Web3Modal.
   */
  initWeb3: function() {
    $.getScript("js/web3.min.js", function() {
      if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/c52a3970da0a47978bee0fe7988b67b6"));
      }
  
      App.initContracts();
      App.initWeb3Modal();
    });
  },
  
  /**
   * Initialize FundManager and FundToken contracts.
   */
  initContracts: function() {
    $.getJSON('abi/RariFundManager.json', function(data) {
      App.contracts.RariFundManager = new web3.eth.Contract(data, "0xa5E348898D6b55B9724Fba87eA709C7aDcF91cBc");
      App.getFundBalance();
      if (App.selectedAccount) App.getMyFundBalance();
    });

    $.getJSON('abi/RariFundToken.json', function(data) {
      App.contracts.RariFundToken = new web3.eth.Contract(data, "0xF8bf0c88f3ebA7ab4aF9675231f4549082546791");
      if (App.selectedAccount) App.getTokenBalance();
    });

    $.getJSON('abi/RariFundProxy.json', function(data) {
      App.contracts.RariFundProxy = new web3.eth.Contract(data, "0x812D7380490bd22A957d9a81a49c1E3Ea296Ec48");
      if (App.selectedAccount) App.getTokenBalance();
    });

    $.getJSON('abi/ERC20.json', function(data) {
      App.contracts.DAI = new web3.eth.Contract(data, "0x6B175474E89094C44Da98b954EedeAC495271d0F");
      App.contracts.USDC = new web3.eth.Contract(data, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
      App.contracts.USDT = new web3.eth.Contract(data, "0xdAC17F958D2ee523a2206206994597C13D831ec7");
    });
  },
  
  /**
   * Bind button click events.
   */
  bindEvents: function() {
    $(document).on('click', '#btn-connect', App.connectWallet);
    $(document).on('click', '#btn-disconnect', App.disconnectWallet);

    $(document).on('change', '#selected-account', function() {
      // Set selected account
      App.selectedAccount = $(this).val();

      // Get user's account balance in the quant fund and RFT balance
      if (App.contracts.RariFundManager) App.getMyFundBalance();
      if (App.contracts.RariFundToken) App.getTokenBalance();
    });

    $(document).on('change', '#DepositAmount', function() {
      $('#DepositSlippage').hide();
    });
    $(document).on('click', '#depositButton', App.handleDeposit);
    $(document).on('change', '#WithdrawAmount', function() {
      $('#WithdrawSlippage').hide();
    });
    $(document).on('click', '#withdrawButton', App.handleWithdraw);
    $(document).on('click', '#transferButton', App.handleTransfer);
  },

  get0xPrice: function(inputTokenSymbol, outputTokenSymbol) {
    return new Promise((resolve, reject) => {
      $.getJSON('https://api.0x.org/swap/v0/prices?sellToken=' + inputTokenSymbol, function(data) {
        var decoded = JSON.parse(data);
        if (!decoded) reject("Failed to decode prices from 0x swap API");
        if (!decoded.records) reject("No prices found on 0x swap API");
        for (var i = 0; i < decoded.records.length; i++)
          if (decoded.records[i].symbol === outputTokenSymbol)
            resolve(decoded.records[i].price);
        reject("Price not found on 0x swap API");
      }).fail(function(err) {
        reject("Error requesting prices from 0x swap API: " + err.message);
      });
    });
  },

  get0xSwapOrders: function(inputTokenAddress, outputTokenAddress, maxInputAmountBN, maxMakerAssetFillAmountBN) {
    return new Promise((resolve, reject) => {
      $.getJSON('https://api.0x.org/swap/v0/quote?sellToken=' + inputTokenAddress + '&buyToken=' + outputTokenAddress + (maxMakerAssetFillAmountBN !== undefined ? '&buyAmount=' + maxMakerAssetFillAmountBN.toString() : '&sellAmount=' + maxInputAmountBN.toString()), function(decoded) {
        if (!decoded) reject("Failed to decode quote from 0x swap API");
        if (!decoded.orders) reject("No orders found on 0x swap API");

        decoded.orders.sort((a, b) => a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) < b.makerAssetAmount / (b.takerAssetAmount + b.takerFee) ? 1 : -1);

        var orders = [];
        var inputFilledAmountBN = web3.utils.toBN(0);
        var takerAssetFilledAmountBN = web3.utils.toBN(0);
        var makerAssetFilledAmountBN = web3.utils.toBN(0);

        for (var i = 0; i < decoded.orders.length; i++) {
          if (decoded.orders[i].takerFee > 0 && decoded.orders[i].takerFeeAssetData !== "0xf47261b0000000000000000000000000" + inputTokenAddress) continue;
          var takerAssetAmountBN = web3.utils.toBN(decoded.orders[i].takerAssetAmount);
          var takerFeeBN = web3.utils.toBN(decoded.orders[i].takerFee);
          var orderInputAmountBN = takerAssetAmountBN.add(takerFeeBN); // Maximum amount we can send to this order including the taker fee
          var makerAssetAmountBN = web3.utils.toBN(decoded.orders[i].makerAssetAmount);

          if (maxMakerAssetFillAmountBN !== undefined) {
            // maxMakerAssetFillAmountBN is specified, so use it
            if (maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN).lte(makerAssetAmountBN)) {
              // Calculate orderTakerAssetFillAmountBN and orderInputFillAmountBN from maxMakerAssetFillAmountBN
              var orderMakerAssetFillAmountBN = maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN);
              var orderTakerAssetFillAmountBN = orderMakerAssetFillAmountBN.mul(takerAssetAmountBN).div(makerAssetAmountBN);
              var orderInputFillAmountBN = orderMakerAssetFillAmountBN.mul(orderInputAmountBN).div(makerAssetAmountBN);
              console.log(orderMakerAssetFillAmountBN.toString(), orderInputFillAmountBN.toString(), makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).toString());
              while (makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN) < orderMakerAssetFillAmountBN) orderInputFillAmountBN.iadd(web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount
              console.log(orderMakerAssetFillAmountBN.toString(), orderInputFillAmountBN.toString(), makerAssetAmountBN.mul(orderInputFillAmountBN).div(orderInputAmountBN).toString());
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

        if (takerAssetFilledAmountBN.isZero()) reject("No orders found on 0x swap API");
        resolve([orders, inputFilledAmountBN, decoded.protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN]);
      }).fail(function(err) {
          reject("Error requesting quote from 0x swap API: " + err.message);
      });
    });
  },
  
  /**
   * Deposit funds to the quant fund.
   */
  handleDeposit: async function(event) {
    event.preventDefault();

    var token = $('#DepositToken').val();
    if (["DAI", "USDC", "USDT", "ETH"].indexOf(token) < 0) return toastr["error"]("Invalid token!", "Deposit failed");
    var amount = parseFloat($('#DepositAmount').val());
    var amountBN = web3.utils.toBN(amount * (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6));
    var accepted = ["DAI", "USDC", "USDT"].indexOf(token) >= 0 ? await App.contracts.RariFundManager.methods.isCurrencyAccepted(token).call() : false;

    if (accepted) {
      $('#DepositSlippage').hide();

      console.log('Deposit ' + amount + ' ' + token + ' directly');

      // Approve tokens to RariFundManager
      var allowanceBN = web3.utils.toBN(await App.contracts[token].methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call());
      if (allowanceBN.lt(amountBN)) await App.contracts[token].methods.approve(App.contracts.RariFundManager.options.address, amountBN).send({ from: App.selectedAccount });
      
      // Deposit tokens to RariFundManager
      try {
        await App.contracts.RariFundManager.methods.deposit(token, amountBN).send({ from: App.selectedAccount });
      } catch (err) {
        return toastr["error"](err, "Deposit failed");
      }
    } else {
      // Get accepted currency
      var acceptedCurrency = null;
      if (token !== "DAI" && await App.contracts.RariFundManager.methods.isCurrencyAccepted("DAI").call()) acceptedCurrency = "DAI";
      else if (token !== "USDC" && await App.contracts.RariFundManager.methods.isCurrencyAccepted("USDC").call()) acceptedCurrency = "USDC";
      else if (token !== "USDT" && await App.contracts.RariFundManager.methods.isCurrencyAccepted("USDT").call()) acceptedCurrency = "USDT";
      if (acceptedCurrency === null) return toastr["error"]("No accepted currencies found.", "Deposit failed");

      // Get orders from 0x swap API
      try {
        var [orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN] = await App.get0xSwapOrders(token === "ETH" ? "WETH" : App.contracts[token].options.address, App.contracts[acceptedCurrency].options.address, amountBN);
      } catch (err) {
        return toastr["error"]("Failed to get swap orders from 0x API: " + err, "Deposit failed");
      }
      
      // Make sure input amount is completely filled
      if (inputFilledAmountBN.lt(amountBN)) {
        $('#DepositAmount').val(inputFilledAmountBN.toString() / (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6));
        return toastr["warning"]("Unable to find enough liquidity to exchange " + token + " before depositing.", "Deposit canceled");
      }

      // Warn user of slippage
      var amountUsd = token === "ETH" ? amount * (await get0xPrice("ETH", acceptedCurrency)) : amount;
      var slippage = 1 - ((makerAssetFilledAmountBN.toString() / (acceptedCurrency === "DAI" ? 1e18 : 1e6)) / amountUsd);
      var slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

      if (!$('#DepositSlippage').is(':visible')) {
        $('#DepositSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-danger">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
        return toastr["warning"]("Please note the exchange slippage required to make a deposit of this currency.", "Deposit canceled");
      }

      if (!$('#DepositSlippage kbd').hasClass(slippage >= 0 ? "text-danger" : "text-success") || $('#DepositSlippage kbd').text() !== slippageAbsPercentageString + "%") {
        $('#DepositSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-danger">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
        return toastr["warning"]("Exchange slippage changed.", "Deposit canceled");
      }

      console.log('Exchange ' + amount + ' ' + token + ' to deposit ' + amount + ' ' + acceptedCurrency);

      // Approve tokens to RariFundProxy if token is not ETH
      if (token !== "ETH") {
        var allowanceBN = web3.utils.toBN(await App.contracts[token].methods.allowance(App.selectedAccount, App.contracts.RariFundProxy.options.address).call());
        if (allowanceBN.lt(amountBN)) await App.contracts[token].methods.approve(App.contracts.RariFundProxy.options.address, amountBN).send({ from: App.selectedAccount });
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
        await App.contracts.RariFundProxy.methods.exchangeAndDeposit(App.contracts[token].options.address, amountBN, acceptedCurrency, orders, signatures, takerAssetFilledAmountBN).send({ from: App.selectedAccount, value: token === "ETH" ? web3.utils.toBN(protocolFee).add(amountBN).toString() : protocolFee });
      } catch (err) {
        return toastr["error"]("RariFundProxy.exchangeAndDeposit failed: " + err, "Deposit failed");
      }

      // Hide old slippage after exchange success
      $('#DepositSlippage').hide();
    }

    // Alert success and refresh balances
    toastr["success"]("Deposit of " + amount + " " + token + " confirmed!", "Deposit successful");
    App.getFundBalance();
    App.getMyFundBalance();
    App.getTokenBalance();
  },
  
  /**
   * Withdraw funds from the quant fund.
   */
  handleWithdraw: async function(event) {
    event.preventDefault();

    var token = $('#WithdrawToken').val();
    if (["DAI", "USDC", "USDT", "ETH"].indexOf(token) < 0) return toastr["error"]("Invalid token!", "Withdrawal failed");
    var amount = parseFloat($('#WithdrawAmount').val());
    var amountBN = web3.utils.toBN(amount * (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6));

    // Approve RFT to RariFundManager
    var allowanceBN = web3.utils.toBN(await App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call());
    if (allowanceBN.lt(web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1))) await App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1)).send({ from: App.selectedAccount });

    // See how much we can withdraw directly if token is not ETH
    var tokenRawFundBalanceBN = web3.utils.toBN(0);

    if (token !== "ETH") {
      try {
        tokenRawFundBalanceBN = web3.utils.toBN(await App.contracts.RariFundManager.methods["getRawFundBalance(string)"](token).call());
      } catch (error) {
        toastr["error"]("Failed to get raw fund balance of output currency.", "Withdrawal failed");
      }
    }

    if (tokenRawFundBalanceBN.gte(amountBN)) {
      // If we can withdraw everything directly, do so
      $('#WithdrawSlippage').hide();
      console.log('Withdraw ' + amountBN + ' of ' + amount + ' ' + token + ' directly');
      await App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({ from: App.selectedAccount });
    } else {
      // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
      var inputCurrencyCodes = [];
      var inputAmountBNs = [];
      var allOrders = [];
      var allSignatures = [];
      var makerAssetFillAmountBNs = [];
      var amountInputtedUsdBN = web3.utils.toBN(0);
      var amountWithdrawnBN = web3.utils.toBN(0);
      var totalProtocolFeeBN = web3.utils.toBN(0);

      // Get input candidates
      var inputCandidates = [];
      for (const inputToken of ["DAI", "USDC", "USDT"]) {
        if (inputToken === token && tokenRawFundBalanceBN.gt(web3.utils.toBN(0))) {
          // Withdraw as much as we can of the output token first
          inputCurrencyCodes.push(token);
          inputAmountBNs.push(tokenRawFundBalanceBN);
          allOrders.push([]);
          allSignatures.push([]);
          makerAssetFillAmountBNs.push(0);
          amountWithdrawnBN.iadd(tokenRawFundBalanceBN);
        } else {
          // Push other candidates to array
          var rawFundBalanceBN = web3.utils.toBN(await App.contracts.RariFundManager.methods["getRawFundBalance(string)"](inputToken).call());
          if (rawFundBalanceBN.gt(web3.utils.toBN(0))) inputCandidates.push({ currencyCode: inputToken, rawFundBalanceBN });
        }
      }

      // Get orders from 0x swap API for each input currency candidate
      for (var i = 0; i < inputCandidates.length; i++) {
        try {
          var [orders, inputFilledAmountBN, protocolFee, takerAssetFilledAmountBN, makerAssetFilledAmountBN] = await App.get0xSwapOrders(App.contracts[inputCandidates[i].currencyCode].options.address, token === "ETH" ? "WETH" : App.contracts[token].options.address, inputCandidates[i].rawFundBalanceBN, amountBN);
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

      console.log(inputCandidates);

      // Loop through input currency candidates until we fill the withdrawal
      for (var i = 0; i < inputCandidates.length; i++) {
        // If there is enough input in the fund and enough 0x orders to fulfill the rest of the withdrawal amount, withdraw and exchange
        if (inputCandidates[i].makerAssetFillAmountBN.gte(amountBN.sub(amountWithdrawnBN))) {
          var thisOutputAmountBN = amountBN.sub(amountWithdrawnBN);
          var thisInputAmountBN = inputCandidates[i].inputFillAmountBN.mul(thisOutputAmountBN).div(inputCandidates[i].makerAssetFillAmountBN);
          console.log(thisOutputAmountBN.toString(), thisInputAmountBN.toString(), inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).toString());
          while (inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN) < thisOutputAmountBN) thisInputAmountBN.iadd(web3.utils.toBN(1)); // Make sure we have enough input fill amount to achieve this maker asset fill amount
          console.log(thisOutputAmountBN.toString(), thisInputAmountBN.toString(), inputCandidates[i].makerAssetFillAmountBN.mul(thisInputAmountBN).div(inputCandidates[i].inputFillAmountBN).toString());

          inputCurrencyCodes.push(inputCandidates[i].currencyCode);
          inputAmountBNs.push(thisInputAmountBN);
          allOrders.push(inputCandidates[i].orders);
          allSignatures.push(inputCandidates[i].signatures);
          makerAssetFillAmountBNs.push(thisOutputAmountBN);

          amountInputtedUsdBN.iadd(thisInputAmountBN.mul(web3.utils.toBN(1e18)).div(web3.utils.toBN(inputCandidates[i].currencyCode === "DAI" ? 1e18 : 1e6)));
          amountWithdrawnBN.iadd(thisOutputAmountBN);
          totalProtocolFeeBN.iadd(web3.utils.toBN(inputCandidates[i].protocolFee));

          break;
        }

        // Add all that we can of the last one, then go through them again
        if (i == inputCandidates.length - 1) {
          inputCurrencyCodes.push(inputCandidates[i].currencyCode);
          inputAmountBNs.push(inputCandidates[i].inputFillAmountBN);
          allOrders.push(inputCandidates[i].orders);
          allSignatures.push(inputCandidates[i].signatures);
          makerAssetFillAmountBNs.push(inputCandidates[i].makerAssetFillAmountBN);

          amountInputtedUsdBN.iadd(inputCandidates[i].inputFillAmountBN.mul(web3.utils.toBN(1e18)).div(web3.utils.toBN(inputCandidates[i].currencyCode === "DAI" ? 1e18 : 1e6)));
          amountWithdrawnBN.iadd(inputCandidates[i].makerAssetFillAmountBN);
          totalProtocolFeeBN.iadd(web3.utils.toBN(inputCandidates[i].protocolFee));

          i = -1;
          inputCandidates.pop();
        }

        // Stop if we have filled the withdrawal
        if (amountWithdrawnBN.gte(amountBN)) break;
      }

      // TODO: Remove log code below
      var inputAmountStrings = [];
      for (var i = 0; i < inputAmountBNs.length; i++) inputAmountStrings[i] = inputAmountBNs[i].toString();
      var makerAssetFillAmountStrings = [];
      for (var i = 0; i < makerAssetFillAmountBNs.length; i++) makerAssetFillAmountStrings[i] = makerAssetFillAmountBNs[i].toString();
      console.log(inputCurrencyCodes, inputAmountStrings, App.contracts[token].options.address, allOrders, allSignatures, makerAssetFillAmountStrings, amountWithdrawnBN.toString());
      
      // Make sure input amount is completely filled
      if (amountWithdrawnBN.lt(amountBN)) {
        $('#WithdrawAmount').val(amountWithdrawnBN.toString() / (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6));
        return toastr["warning"]("Unable to find enough liquidity to exchange withdrawn tokens to " + token + ".", "Withdrawal canceled");
      }

      // Warn user of slippage
      var amountUsd = token === "ETH" ? amount * (await get0xPrice("ETH", acceptedCurrency)) : amount;
      var slippage = 1 - (amountUsd / (amountInputtedUsdBN.toString() / 1e18));
      var slippageAbsPercentageString = Math.abs(slippage * 100).toFixed(3);

      if (!$('#WithdrawSlippage').is(':visible')) {
        $('#WithdrawSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-danger">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
        return toastr["warning"]("Please note the exchange slippage required to make a withdrawal of this currency.", "Withdrawal canceled");
      }

      if (!$('#WithdrawSlippage kbd').hasClass(slippage >= 0 ? "text-danger" : "text-success") || $('#WithdrawSlippage kbd').text() !== slippageAbsPercentageString + "%") {
        $('#WithdrawSlippage').html(slippage >= 0 ? 'Slippage: <kbd class="text-danger">' + slippageAbsPercentageString + '%</kbd>' : 'Bonus: <kbd class="text-success">' + slippageAbsPercentageString + '%</kbd>').show();
        return toastr["warning"]("Exchange slippage changed.", "Withdrawal canceled");
      }

      console.log('Withdraw and exchange to ' + (amountWithdrawnBN.toString() / (["DAI", "ETH"].indexOf(token) >= 0 ? 1e18 : 1e6)) + ' ' + token);

      // Withdraw and exchange tokens via RariFundProxy
      try {
        var inputAmountStrings = [];
        for (var i = 0; i < inputAmountBNs.length; i++) inputAmountStrings[i] = inputAmountBNs[i].toString();
        var makerAssetFillAmountStrings = [];
        for (var i = 0; i < makerAssetFillAmountBNs.length; i++) makerAssetFillAmountStrings[i] = makerAssetFillAmountBNs[i].toString();
        console.log(inputCurrencyCodes, inputAmountStrings, App.contracts[token].options.address, allOrders, allSignatures, makerAssetFillAmountStrings);
        await App.contracts.RariFundProxy.methods.withdrawAndExchange(inputCurrencyCodes, inputAmountStrings, App.contracts[token].options.address, allOrders, allSignatures, makerAssetFillAmountStrings).send({ from: App.selectedAccount, value: totalProtocolFeeBN, nonce: await web3.eth.getTransactionCount(App.selectedAccount) });
      } catch (err) {
        return toastr["error"]("RariFundProxy.withdrawAndExchange failed: " + err, "Withdrawal failed");
      }

      // Hide old slippage after exchange success
      $('#WithdrawSlippage').hide();
    }
    
    // Alert success and refresh balances
    toastr["success"]("Withdrawal of " + amount + " " + token + " confirmed!", "Withdrawal successful");
    App.getFundBalance();
    App.getMyFundBalance();
    App.getTokenBalance();
  },

  /**
   * Get the total balance of the quant fund in USD.
   */
  getFundBalance: function() {
    console.log('Getting fund balance...');

    App.contracts.RariFundManager.methods.getFundBalance().call().then(function(result) {
      balance = result / 1e18;
      $('#USDBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get the user's account balance in the quant fund in USD.
   */
  getMyFundBalance: function() {
    console.log('Getting my fund balance...');

    App.contracts.RariFundManager.methods.balanceOf(App.selectedAccount).call().then(function(result) {
      balance = result / 1e18;
      $('#MyUSDBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Transfer RariFundToken.
   */
  handleTransfer: function(event) {
    event.preventDefault();

    var amount = parseFloat($('#RFTTransferAmount').val());
    var toAddress = $('#RFTTransferAddress').val();

    console.log('Transfer ' + amount + ' RFT to ' + toAddress);

    App.contracts.RariFundToken.methods.transfer(toAddress, web3.utils.toBN(amount * 1e18)).send({ from: App.selectedAccount }).then(function(result) {
      toastr["success"]("Transfer of " + amount + " RFT confirmed!", "Transfer successful");
      return App.getTokenBalance();
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get's the user's balance of RariFundToken.
   */
  getTokenBalance: function() {
    console.log('Getting token balance...');

    App.contracts.RariFundToken.methods.balanceOf(App.selectedAccount).call().then(function(result) {
      balance = result / 1e18;
      $('#RFTBalance').text(balance);
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

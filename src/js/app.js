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
      $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0x39aa39c021dfbae8fac545936693ac917d5e7563&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365"),
      $.getJSON("https://api.compound.finance/api/v2/market_history/graph?asset=0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9&min_block_timestamp=" + epochOneYearAgo + "&max_block_timestamp=" + epoch + "&num_buckets=365")
    ]).then(function(values) {
      var ourData = {};

      var dydxAvgs = [];

      for (var i = 0; i < values[0].length; i++) {
        // dYdX graph
        dydxAvgs.push({ t: new Date(parseInt(values[0][i].t)), y: values[0][i].y });

        // Calculate max for Rari graph
        ourData[Math.floor(values[0][i].t / 86400 / 1000) * 86400 * 1000] = values[0][i].y / 100;
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
        // Calculate average for Compound graph
        var sum = 0;
        for (var j = 0; j < compoundData[epochs[i]].length; j++) sum += compoundData[epochs[i]][j];
        var avg =  sum / compoundData[epochs[i]].length;
        compoundAvgs.push({ t: new Date(parseInt(epochs[i])), y: avg * 100 });

        // Also use avg for Rari graph
        // TODO: Replace use of avg with max once stablecoin conversions have been implemented
        var flooredEpoch = Math.floor(epochs[i] / 86400 / 1000) * 86400 * 1000;
        // var max = Math.max(Math.max.apply(null, compoundData[epochs[i]]));
        // if (ourData[flooredEpoch] === undefined || max > ourData[flooredEpoch]) ourData[flooredEpoch] = max;
        if (ourData[flooredEpoch] === undefined || avg > ourData[flooredEpoch]) ourData[flooredEpoch] = avg;
      }

      // Turn Rari data into object for graph
      var ourAvgs = [];
      var epochs = Object.keys(ourData).sort();
      for (var i = 0; i < epochs.length; i++) ourAvgs.push({ t: new Date(parseInt(epochs[i])), y: ourData[epochs[i]] * 100 });

      // console.log(values, compoundData, compoundAvgs, ourData, ourAvgs)

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
                labelString: 'APR'
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
      toastr["error"]("Ethereum connection failed", "Invalid chain selected.");
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

    $(document).on('click', '#depositButton', App.handleDeposit);
    $(document).on('click', '#withdrawButton', App.handleWithdraw);
    $(document).on('click', '#transferButton', App.handleTransfer);
  },
  
  /**
   * Deposit funds to the quant fund.
   */
  handleDeposit: function(event) {
    event.preventDefault();

    var token = $('#DepositToken').val();
    if (["DAI", "USDC", "USDT"].indexOf(token) < 0) return toastr["error"]("Deposit failed", "Invalid token!");
    var amount = parseFloat($('#DepositAmount').val());
    var amountBN = web3.utils.toBN(amount * (token === "DAI" ? 1e18 : 1e6));

    App.contracts.RariFundManager.methods.isCurrencyAccepted(token).call().then(function(accepted) {
      function deposit() {
        console.log('Deposit ' + amount + ' ' + token);
  
        App.contracts[token].methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call().then(function(result) {
          if (result >= amount) return;
          return App.contracts[token].methods.approve(App.contracts.RariFundManager.options.address, amountBN).send({ from: App.selectedAccount });
        }).then(function(result) {
          return App.contracts.RariFundManager.methods.deposit(token, amountBN).send({ from: App.selectedAccount });
        }).then(function(result) {
          toastr["success"]("Deposit successful", "Deposit of " + amount + " " + token + " confirmed!");
          App.getFundBalance();
          App.getMyFundBalance();
          App.getTokenBalance();
        }).catch(function(err) {
          console.error(err);
        });
      }

      if (!accepted) {
        var availableAssetDatas = [];
        App.contracts.RariFundManager.methods.isCurrencyAccepted("DAI").call().then(function(accepted) {
          if (accepted) availableAssetDatas.push('0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f');
          return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDC").call();
        }).then(function(accepted) {
          if (accepted) availableAssetDatas.push('0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
          return App.contracts.RariFundManager.methods.isCurrencyAccepted("USDT").call();
        }).then(function(accepted) {
          if (accepted) availableAssetDatas.push('0xf47261b0000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7');
        });

        return zeroExInstant.render({
          orderSource: 'https://api.0x.org/sra/',
          availableAssetDatas,
          provider: App.web3Provider, // TODO: Set walletDisplayName
          defaultAssetBuyAmount: amount,
          onSuccess: deposit
        }, 'body');
      }

      return deposit();
    });
  },
  
  /**
   * Withdraw funds from the quant fund.
   */
  handleWithdraw: function(event) {
    event.preventDefault();

    var token = $('#WithdrawToken').val();
    if (["DAI", "USDC", "USDT"].indexOf(token) < 0) return toastr["error"]("Withdrawal failed", "Invalid token!");
    var amount = parseFloat($('#WithdrawAmount').val());
    var amountBN = web3.utils.toBN(amount * (token === "DAI" ? 1e18 : 1e6));

    console.log('Withdraw ' + amount + ' ' + token);

    App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call().then(function(result) {
      if (result >= amount) return;
      return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1)).send({ from: App.selectedAccount });
    }).then(function(result) {
      return App.contracts.RariFundManager.methods.withdraw(token, amountBN).send({ from: App.selectedAccount });
    }).then(function(result) {
      toastr["success"]("Withdrawal successful", "Withdrawal of " + amount + " " + token + " confirmed!");
      App.getFundBalance();
      App.getMyFundBalance();
      App.getTokenBalance();
    }).catch(function(err) {
      console.error(err);
    });
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
      toastr["success"]("Transfer successful", "Transfer of " + amount + " RFT confirmed!");
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

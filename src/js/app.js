// Unpackage imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.EvmChains;
const Fortmatic = window.Fortmatic;

App = {
  web3: null,
  web3Modal: null,
  web3Provider: null,
  accounts: [],
  selectedAccount: null,
  contracts: {},

  init: function() {
    App.initWeb3();
    App.bindEvents();
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
          key: "pk_test_391E26A3B43A3350" // TODO: Replace Mikko's TESTNET api key
        }
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

    if (chainId !== 1) {
      $('#depositButton, #withdrawButton, #transferButton').prop("disabled", true);
      toastr["danger"]("Ethereum connection failed", "Invalid chain selected.");
    }
  
    // Get list of accounts of the connected wallet
    // MetaMask does not give you all accounts, only the selected account
    App.accounts = await App.web3.eth.getAccounts();
    App.selectedAccount = App.accounts[0];

    // Get user's stablecoin balances and token balances
    if (App.contracts.RariFundManager) App.getMyFundBalances();
    if (App.contracts.RariFundToken) App.getTokenBalances();
  
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
    $("#MyDAIBalance, #RFTBalance").text("?");
  
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
    $.getJSON('RariFundManager.json', function(data) {
      App.contracts.RariFundManager = new web3.eth.Contract(data, "0xCa3187F301920877795EfD16B5f920aABC7a9cC2");
      App.getFundBalances();
      if (App.selectedAccount) App.getMyFundBalances();
    });

    $.getJSON('RariFundToken.json', function(data) {
      App.contracts.RariFundToken = new web3.eth.Contract(data, "0x946a1c5415a41abfbcbc8d60d302f6df4d8911c3");
      if (App.selectedAccount) App.getTokenBalances();
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

      // Get user's stablecoin balances and token balances
      if (App.contracts.RariFundManager) App.getMyFundBalances();
      if (App.contracts.RariFundToken) App.getTokenBalances();
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
    if (["DAI"].indexOf(token) < 0) return toastr["danger"]("Deposit failed", "Invalid token!");
    var amount = parseFloat($('#DepositAmount').val());

    console.log('Deposit ' + amount + ' ' + token);

    var dai = new web3.eth.Contract(erc20Abi, "0x6B175474E89094C44Da98b954EedeAC495271d0F");;

    dai.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call().then(function(result) {
      if (result >= amount) return;
      return dai.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(amount * 1e18)).send({ from: App.selectedAccount });
    }).then(function(result) {
      return App.contracts.RariFundManager.methods.deposit("DAI", web3.utils.toBN(amount * 1e18)).send({ from: App.selectedAccount });
    }).then(function(result) {
      toastr["success"]("Deposit successful", "Deposit of " + amount + " " + token + " confirmed!");
      App.getFundBalances();
      App.getMyFundBalances();
      App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },
  
  /**
   * Withdraw funds from the quant fund.
   */
  handleWithdraw: function(event) {
    event.preventDefault();

    var token = $('#WithdrawToken').val();
    if (["DAI"].indexOf(token) < 0) return toastr["danger"]("Withdrawal failed", "Invalid token!");
    var amount = parseFloat($('WithdrawAmount').val());

    console.log('Withdraw ' + amount + ' ' + token);

    App.contracts.RariFundToken.methods.allowance(App.selectedAccount, App.contracts.RariFundManager.options.address).call().then(function(result) {
      if (result >= amount) return;
      return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1)).send({ from: App.account });
    }).then(function(result) {
      return App.contracts.RariFundManager.methods.withdraw("DAI", web3.utils.toBN(amount * 1e18)).send({ from: App.selectedAccount });
    }).then(function(result) {
      toastr["success"]("Withdrawal successful", "Withdrawal of " + amount + " " + token + " confirmed!");
      App.getFundBalances();
      App.getMyFundBalances();
      App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get the total balance of each supported stablecoin in the quant fund.
   */
  getFundBalances: function() {
    console.log('Getting fund balances...');

    App.contracts.RariFundManager.methods.getTotalBalance("DAI").call().then(function(result) {
      balance = result / 1e18;
      $('#DAIBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get the user's balance of each supported stablecoin in the quant fund.
   */
  getMyFundBalances: function() {
    console.log('Getting my fund balances...');

    App.contracts.RariFundManager.methods.balanceOf("DAI", App.selectedAccount).call().then(function(result) {
      balance = result / 1e18;
      $('#MyDAIBalance').text(balance);
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

    App.contracts.RariFundToken.methods.transfer(toAddress, amount * 1e18).send({ from: App.selectedAccount }).then(function(result) {
      toastr["success"]("Transfer successful", "Transfer of " + amount + " RFT confirmed!");
      return App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },

  /**
   * Get's the user's balance of RariFundToken.
   */
  getTokenBalances: function() {
    console.log('Getting token balances...');

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

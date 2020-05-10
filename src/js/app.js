App = {
  account: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    $.getScript("js/web3.min.js", function() {
      if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/c52a3970da0a47978bee0fe7988b67b6"));
      }
  
      if (typeof window.ethereum !== 'undefined') {
        ethereum.enable().then(function(accounts) {
          App.account = accounts[0];
          if (App.contracts.RariFundManager) App.getMyFundBalances();
          if (App.contracts.RariFundToken) App.getTokenBalances();
          App.enableActions();
        }).catch(function(err) {
          console.error(err);
        });
      }
  
      return App.initContract();
    });
  },

  initContract: function() {
    $.getJSON('RariFundManager.json', function(data) {
      App.contracts.RariFundManager = new web3.eth.Contract(data, "0xCa3187F301920877795EfD16B5f920aABC7a9cC2");
      App.getFundBalances();
      if (App.account) App.getMyFundBalances();
    });

    $.getJSON('RariFundToken.json', function(data) {
      App.contracts.RariFundToken = new web3.eth.Contract(data, "0x946a1c5415a41abfbcbc8d60d302f6df4d8911c3");
      if (App.account) App.getTokenBalances();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#depositButton', App.handleDeposit);
    $(document).on('click', '#withdrawButton', App.handleWithdraw);
    $(document).on('click', '#transferButton', App.handleTransfer);
  },

  enableActions: function() {
    $('#depositButton, #withdrawButton, #transferButton').prop("disabled", false);
  },

  handleDeposit: function(event) {
    event.preventDefault();

    var amount = parseFloat($('#DAIDepositAmount').val());

    console.log('Deposit ' + amount + ' DAI');

    var dai = new web3.eth.Contract(erc20Abi, "0x6B175474E89094C44Da98b954EedeAC495271d0F");;

    dai.methods.allowance(App.account, App.contracts.RariFundManager.options.address).call().then(function(result) {
      if (result >= amount) return;
      return dai.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(amount * 1e18)).send({ from: App.account });
    }).then(function(result) {
      return App.contracts.RariFundManager.methods.deposit("DAI", web3.utils.toBN(amount * 1e18)).send({ from: App.account });
    }).then(function(result) {
      alert('Deposit Successful!');
      App.getFundBalances();
      App.getMyFundBalances();
      App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },

  handleWithdraw: function(event) {
    event.preventDefault();

    var amount = parseFloat($('#DAIWithdrawAmount').val());

    console.log('Withdraw ' + amount + ' DAI');

    App.contracts.RariFundToken.methods.allowance(App.account, App.contracts.RariFundManager.options.address).call().then(function(result) {
      if (result >= amount) return;
      return App.contracts.RariFundToken.methods.approve(App.contracts.RariFundManager.options.address, web3.utils.toBN(2).pow(web3.utils.toBN(256)).subn(1)).send({ from: App.account });
    }).then(function(result) {
      return App.contracts.RariFundManager.methods.withdraw("DAI", web3.utils.toBN(amount * 1e18)).send({ from: App.account });
    }).then(function(result) {
      alert('Withdrawal Successful!');
      App.getFundBalances();
      App.getMyFundBalances();
      App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getFundBalances: function() {
    console.log('Getting fund balances...');

    App.contracts.RariFundManager.methods.getTotalBalance("DAI").call().then(function(result) {
      balance = result / 1e18;
      $('#DAIBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  },

  getMyFundBalances: function() {
    console.log('Getting my fund balances...');

    App.contracts.RariFundManager.methods.balanceOf("DAI", App.account).call().then(function(result) {
      balance = result / 1e18;
      $('#MyDAIBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  },

  handleTransfer: function(event) {
    event.preventDefault();

    var amount = parseFloat($('#FFTTransferAmount').val());
    var toAddress = $('#FFTTransferAddress').val();

    console.log('Transfer ' + amount + ' FFT to ' + toAddress);

    App.contracts.RariFundToken.methods.transfer(toAddress, amount * 1e18).send({ from: App.account }).then(function(result) {
      alert('Transfer Successful!');
      return App.getTokenBalances();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getTokenBalances: function() {
    console.log('Getting token balances...');

    App.contracts.RariFundToken.methods.balanceOf(App.account).call().then(function(result) {
      balance = result / 1e18;
      $('#FFTBalance').text(balance);
    }).catch(function(err) {
      console.error(err);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

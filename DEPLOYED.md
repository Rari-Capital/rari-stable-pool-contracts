# Rari Stable Pool: Deployed Smart Contracts

As follows are all deployments of our smart contracts on the Ethereum mainnet. See [`API.md`](API.md) for reference on these contracts' public methods and [`USAGE.md`](USAGE.md) for instructions on how to use them.

## Latest Versions

### `RariFundController`

`RariFundController` holds supplied funds and is used by the rebalancer to deposit and withdraw from pools and make exchanges.

**v2.0.0**: `0xEe7162bB5191E8EC803F7635dE9A920159F1F40C`

### `RariFundManager`

`RariFundManager` is the Rari Stable Pool's main contract: it handles deposits, withdrawals, USD balances, interest, fees, etc.

**v2.2.0**: `0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a`

### `RariFundToken`

The Rari Stable Pool Token (RSPT) is an ERC20 token used to internally account for the ownership of funds supplied to the Rari Stable Pool.

**v2.1.0**: `0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0`

### `RariFundPriceConsumer`

`RariFundPriceConsumer` retrieves stablecoin prices from Chainlink's public price feeds (used by `RariFundManager` and `RariFundController`).

**v2.3.0**: `0xFE98A52bCAcC86432E7aa76376751DcFAB202244`

### `RariFundProxy`

`RariFundProxy` includes wrapper functions built on top of `RariFundManager`: exchange and deposit, withdraw and exchange, deposit without paying gas via the Gas Station Network (GSN).

**v2.4.0**: `0xe4deE94233dd4d7c2504744eE6d34f3875b3B439`

## Older Versions

### `RariFundController`

* **v1.1.0**: `0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb`

### `RariFundManager`

* **v2.1.0**: `0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a`
* **v2.0.0**: `0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a`
* **v1.1.0**: `0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464`
* **v1.0.0**: `0x686ac9d046418416d3ed9ea9206f3dace4943027`

### `RariFundToken`

* **v2.0.0**: `0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0`
* **v1.0.0**: `0x9366B7C00894c3555c7590b0384e5F6a9D55659f`

### `RariFundPriceConsumer`

* **v2.0.0**: `0x77a817077cd7Cf0c6e0d4d2c4464648FF6C3fdB8`

### `RariFundProxy`

* **v2.2.0**: `0xB202cAd3965997f2F5E67B349B2C5df036b9792e`
* **v2.0.0**: `0xD4be7E211680e12c08bbE9054F0dA0D646c45228`
* **v1.2.0**: `0xb6b79D857858004BF475e4A57D4A446DA4884866`
* **v1.1.0**: `0x318cfd99b60a63d265d2291a4ab982073fbf245d`
* **v1.0.0**: `0x27C4E34163b5FD2122cE43a40e3eaa4d58eEbeaF`

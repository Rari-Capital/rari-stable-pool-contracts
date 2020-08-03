# Rari Capital Deployed Ethereum Smart Contract Addresses

As follows are all deployments of our smart contracts on the Ethereum mainnet. See `API.md` for more information on these contracts' APIs.

## Latest Versions

### RariFundController

RariFundController holds funds and is used by the rebalancer to deposit and withdraw from pools and make exchanges.

**v1.1.0**: `0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb`

### RariFundManager

RariFundManager is the fund's main contract: it handles deposits, withdrawals, USD balances, interest, fees, etc.

**v1.1.0**: `0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464`

### RariFundToken

The Rari Fund Token (RFT) is an ERC20 token used to internally account for the ownership of the fund's assets under management (AUM).

**v1.0.0**: `0x9366B7C00894c3555c7590b0384e5F6a9D55659f`

### RariFundProxy

Includes wrapper functions built on top of RariFundManager: exchange and deposit, withdraw and exchange, deposit without paying gas via the Gas Station Network (GSN).

**v1.2.0**: `0xb6b79D857858004BF475e4A57D4A446DA4884866`

## Older Versions

### RariFundManager

* **v1.0.0**: `0x686ac9d046418416d3ed9ea9206f3dace4943027`

### RariFundProxy

* **v1.1.0**: `0x318cfd99b60a63d265d2291a4ab982073fbf245d`
* **v1.0.0**: `0x27C4E34163b5FD2122cE43a40e3eaa4d58eEbeaF`

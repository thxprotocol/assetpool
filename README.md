# Assetpool

The THX assetpool is based on the [Diamond standard](https://dev.to/mudgen/ethereum-s-maximum-contract-size-limit-is-solved-with-the-diamond-standard-2189).

## Diamond edits

The Diamond has been edited to allow meta transactions. The `_msgSender()` is replacing `msg.sender`, this will retrieve the user that is signing the function in case of a meta transaction, and the sender in case of a 'normal' transaction.

inspiration

- https://github.com/anydotcrypto/metatransactions/blob/master/src/contracts/account/RelayHub.sol#L48
- https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/GSN/GSNRecipient.sol#L195

## Facets

- AssetPoolFacet
- GasStationFacet
- PollFacet
  - RewardPoll
  - RewardPollBypass
  - WithdrawPoll
  - WithdrawPollBypass
- RolesFacet, _(based on openzeppeling standards)_

### AssetPoolFacet

The core of the solution, this facet creates rewardpolls and withdrawpolls, and enables parameter setters for the polls, like `setProposeWithdrawPollDuration`

### GasStationFacet

The point of entry for the meta/signed transaction.

### PollFacet

The different polls, a proxy is being used to generate a storage pointer in the actual implementation. Functions like `function vote(bool _agree)` can be used without needing to use an id as the first parameter.

### RolesFacet

This implemenation is based on the open zeppelin one. Edited to work with external storage and created a `..View` so these can be included in other Facets.

> TODO: consider upgrading to libraries for this view implementation.


## Factory

A factory contract is being to deploy the solution. The factory initialises every facet independently and keeps track of deployed asset pools.
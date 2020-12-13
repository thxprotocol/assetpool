// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./BasePoll.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract RewardPollFacet is BasePoll {
    event Sender(address sender);

    // needed for tests to run
    function test() public {}

}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract RewardPollFacet is BasePoll, RolesView {
    event Sender(address sender);

   function vote(bool _agree) external override {
        address _voter = _msgSender();
        require(_isMember(_voter), 'NO_MEMBER');
        _vote(_agree, _voter);
    }
}

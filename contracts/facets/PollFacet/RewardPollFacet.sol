// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";

contract RewardPollFacet is BasePoll, RolesView {
    uint256 constant ENABLE_REWARD = 2**250;
    uint256 constant DISABLE_REWARD = 2**251;

    event Sender(address sender);

    function vote(bool _agree) external override {
        address _voter = _msgSender();
        require(_isMember(_voter), "NO_MEMBER");
        _vote(_agree, _voter);
    }

    /**
     * @dev callback called after poll finalization
     */
    function onPollFinish(uint256 _id) internal override {
        LibRewardPollStorage.RPStorage storage rwPollData = LibRewardPollStorage
            .rpStorageId(_id);

        LibAssetPoolStorage.Reward storage rwAssetPool = LibAssetPoolStorage
            .apStorage()
            .rewards[rwPollData.rewardIndex];

        bool approved = _getCurrentApprovalState();
        if (approved) {
            if (rwPollData.withdrawAmount == ENABLE_REWARD) {
                rwAssetPool.state = LibAssetPoolStorage.RewardState.Enabled;
            } else if (rwPollData.withdrawAmount == DISABLE_REWARD) {
                rwAssetPool.state = LibAssetPoolStorage.RewardState.Disabled;
            } else {
                // initial state
                if (
                    rwAssetPool.withdrawAmount == 0 &&
                    rwAssetPool.withdrawDuration == 0
                ) {
                    rwAssetPool.state = LibAssetPoolStorage.RewardState.Enabled;
                }
                rwAssetPool.withdrawAmount = rwPollData.withdrawAmount;
                rwAssetPool.withdrawDuration = rwPollData.withdrawDuration;
            }
        }

        delete rwAssetPool.pollId;
        delete rwPollData.withdrawAmount;
        delete rwPollData.withdrawDuration;
    }
}

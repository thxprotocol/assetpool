// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./LibBasePollStorage.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";

contract RewardPollFacet is BasePoll, RolesView {
    uint256 constant ENABLE_REWARD = 2**250;
    uint256 constant DISABLE_REWARD = 2**251;

    function voteValidate(bool _agree, address _voter) internal override {
        require(_isMember(_voter), "NO_MEMBER");
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

        bool approved = _rewardPollApprovalState();
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

    modifier isReward {
        LibBasePollStorage.BasePollStorage storage bData = baseData();

        LibRewardPollStorage.RPStorage storage rwPollData = LibRewardPollStorage
            .rpStorageId(bData.id);

        require(rwPollData.withdrawAmount != 0, "NOT_REWARD_POLL");
        _;
    }

    function _rewardPollVote(bool _agree) external isReward {
        vote(_agree);
    }

    function _rewardPollRevokeVote() external isReward {
        revokeVote();
    }

    function _rewardPollFinalize() external isReward {
        finalize();
    }

    function _rewardPollApprovalState() public view isReward returns (bool) {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }
}

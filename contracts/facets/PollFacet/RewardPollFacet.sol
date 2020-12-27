// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./LibBasePollStorage.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";
import "../../interfaces/IRewardPoll.sol";

contract RewardPollFacet is IRewardPoll, BasePoll, RolesView {
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
                emit RewardPollEnabled(_id);
            } else if (rwPollData.withdrawAmount == DISABLE_REWARD) {
                rwAssetPool.state = LibAssetPoolStorage.RewardState.Disabled;
                emit RewardPollDisabled(_id);
            } else {
                // initial state
                if (
                    rwAssetPool.withdrawAmount == 0 &&
                    rwAssetPool.withdrawDuration == 0
                ) {
                    rwAssetPool.state = LibAssetPoolStorage.RewardState.Enabled;
                    emit RewardPollEnabled(_id);
                }
                rwAssetPool.withdrawAmount = rwPollData.withdrawAmount;
                rwAssetPool.withdrawDuration = rwPollData.withdrawDuration;
                emit RewardPollUpdated(_id, rwAssetPool.withdrawAmount, rwAssetPool.withdrawDuration);
            }
        }
        emit RewardPollFinalized(_id, approved);
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

    function _rewardPollVote(bool _agree) external override isReward {
        vote(_agree);
        emit RewardPollVoted(baseData().id, _msgSender(), _agree);
    }

    function _rewardPollRevokeVote() external override isReward {
        revokeVote();
        emit RewardPollRevokedVote(baseData().id, _msgSender());
    }

    function _rewardPollFinalize() external override isReward {
        finalize();
    }

    function _rewardPollApprovalState() public override view isReward returns (bool) {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }

     // Rewardpoll
    function getRewardIndex(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).rewardIndex;
    }

    function getWithdrawAmount(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).withdrawAmount;
    }

    function getWithdrawDuration(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).withdrawDuration;
    }
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "diamond-2/contracts/libraries/LibDiamond.sol";
import "../PollFacet/LibRewardPollStorage.sol";
import "../PollFacet/LibBasePollStorage.sol";
import "../RolesFacet/RolesView.sol";
import "../../interfaces/IAssetPool.sol";
import "./LibAssetPoolStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract AssetPoolFacet is IAssetPool, RolesView, RelayReceiver {
    uint256 constant ENABLE_REWARD = 2**250;
    uint256 constant DISABLE_REWARD = 2**251;

    function initializeAssetPool(address _tokenAddress) public override {
        // TODO, decide if reinitialize should be possible
        require(msg.sender == LibDiamond.diamondStorage().contractOwner);

        LibAssetPoolStorage.APstorage storage s = LibAssetPoolStorage
            .apStorage();
        s.token = IERC20(_tokenAddress);
    }

    /**
     * @dev Set the duration for a withdraw poll poll.
     * @param _duration Duration in seconds
     */
    function setProposeWithdrawPollDuration(uint256 _duration)
        public
        override
        onlyManager
    {
        LibAssetPoolStorage.apStorage().proposeWithdrawPollDuration = _duration;
    }

    /**
     * @dev Set the reward poll duration
     * @param _duration Duration in seconds
     */
    function setRewardPollDuration(uint256 _duration)
        public
        override
        onlyManager
    {
        LibAssetPoolStorage.apStorage().rewardPollDuration = _duration;
    }

    /**
     * @dev Creates a reward.
     * @param _withdrawAmount Initial size for the reward.
     * @param _withdrawDuration Initial duration for the reward.
     */
    function addReward(uint256 _withdrawAmount, uint256 _withdrawDuration)
        public
        override
        onlyOwner
    {
        // TODO allow reward 0?
        require(_withdrawAmount != ENABLE_REWARD, "NOT_VALID");
        require(_withdrawAmount != DISABLE_REWARD, "NOT_VALID");
        LibAssetPoolStorage.Reward memory reward;

        reward.id = LibAssetPoolStorage.apStorage().rewards.length;
        reward.state = LibAssetPoolStorage.RewardState.Disabled;
        _createRewardPoll(reward.id, _withdrawAmount, _withdrawDuration);
        LibAssetPoolStorage.apStorage().rewards.push(reward);
    }

    /**
     * @dev Updates a reward poll
     * @param _id References reward
     * @param _withdrawAmount New size for the reward.
     * @param _withdrawDuration New duration of the reward
     */
    function updateReward(
        uint256 _id,
        uint256 _withdrawAmount,
        uint256 _withdrawDuration
    ) public onlyOwner {
        // todo verify amount
        require(_isMember(_msgSender()), "NOT_MEMBER");
        LibAssetPoolStorage.Reward memory current = LibAssetPoolStorage
            .apStorage()
            .rewards[_id];

        LibBasePollStorage.BasePollStorage storage poll = LibBasePollStorage
            .basePollStorageId(_id);

        // storage will be deleted (e.g. set to default) after poll is finalized
        require(poll.endTime == 0, "IS_NOT_FINALIZED");
        // setting both params to initial state is not allowed
        // this is a reserverd state for new rewards
        require(
            !(_withdrawAmount == 0 && _withdrawDuration == 0),
            "NOT_ALLOWED"
        );

        require(
            !(_withdrawAmount == ENABLE_REWARD &&
                current.state == LibAssetPoolStorage.RewardState.Enabled),
            "ALREADY_ENABLED"
        );

        require(
            !(_withdrawAmount == DISABLE_REWARD &&
                current.state == LibAssetPoolStorage.RewardState.Disabled),
            "ALREADY_DISABLED"
        );

        require(
            current.withdrawAmount != _withdrawAmount &&
                current.withdrawDuration != _withdrawDuration,
            "IS_EQUAL"
        );

        _createRewardPoll(_id, _withdrawAmount, _withdrawDuration);
    }

    /**
     * @dev Starts a reward poll and stores the address of the poll.
     * @param _id Referenced reward
     * @param _withdrawAmount Size of the reward
     * @param _withdrawDuration Duration of the reward poll
     */
    function _createRewardPoll(
        uint256 _id,
        uint256 _withdrawAmount,
        uint256 _withdrawDuration
    ) internal {

            LibBasePollStorage.BasePollStorage storage baseStorage
         = LibBasePollStorage.basePollStorageId(_id);

        LibAssetPoolStorage.APstorage storage apst = LibAssetPoolStorage
            .apStorage();

        baseStorage.id = apst.pollCounter;
        baseStorage.startTime = block.timestamp;
        baseStorage.endTime = block.timestamp + apst.rewardPollDuration;

        LibRewardPollStorage.RPStorage storage rpStorage = LibRewardPollStorage
            .rpStorageId(_id);

        rpStorage.rewardIndex = _id;
        rpStorage.withdrawAmount = _withdrawAmount;
        rpStorage.withdrawDuration = _withdrawDuration;

        apst.pollCounter = apst.pollCounter + 1;
    }
}

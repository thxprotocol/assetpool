// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "diamond-2/contracts/libraries/LibDiamond.sol";
import "../PollFacet/LibRewardPollStorage.sol";
import "./Roles.sol";

contract AssetPoolFacet is Roles {
    uint256 constant ENABLE_REWARD = 2**250;
    uint256 constant DISABLE_REWARD = 2**251;

    function initializeAssetPool(address _owner, address _tokenAddress) public {
        // TODO, decide if reinitialize should be possible
        require(msg.sender == LibDiamond.diamondStorage().contractOwner);

        __Roles_init(_owner);

        LibAssetPoolStorage.APstorage storage s = LibAssetPoolStorage
            .apStorage();
        s.owner = _owner;
        s.token = IERC20(_tokenAddress);
    }

    function getToken() public view returns (address) {
        return address(LibAssetPoolStorage.apStorage().token);
    }

    /**
     * @dev Set the duration for a withdraw poll poll.
     * @param _duration Duration in seconds
     */
    function setProposeWithdrawPollDuration(uint256 _duration)
        public
        onlyManager
    {
        LibAssetPoolStorage.apStorage().proposeWithdrawPollDuration = _duration;
    }

    function getProposeWithdrawPollDuration() public view returns (uint256) {
        return LibAssetPoolStorage.apStorage().proposeWithdrawPollDuration;
    }

    /**
     * @dev Set the reward poll duration
     * @param _duration Duration in seconds
     */
    function setRewardPollDuration(uint256 _duration) public onlyManager {
        LibAssetPoolStorage.apStorage().rewardPollDuration = _duration;
    }

    function getRewardPollDuration() public view returns (uint256) {
        return LibAssetPoolStorage.apStorage().rewardPollDuration;
    }

    /**
     * @dev Creates a reward.
     * @param _withdrawAmount Initial size for the reward.
     * @param _withdrawDuration Initial duration for the reward.
     */
    function addReward(uint256 _withdrawAmount, uint256 _withdrawDuration)
        public
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
        LibRewardPollStorage.RPStorage storage st = LibRewardPollStorage
            .rpStorageId(_id);
        st.id = _id;
        st.withdrawAmount = _withdrawAmount;
        st.withdrawDuration = _withdrawDuration;
        st.endtime =
            block.timestamp +
            LibAssetPoolStorage.apStorage().rewardPollDuration;
    }
}

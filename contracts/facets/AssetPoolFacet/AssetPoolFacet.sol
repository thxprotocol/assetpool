// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "diamond-2/contracts/libraries/LibDiamond.sol";
import "../PollFacet/LibRewardPollStorage.sol";
import "../PollFacet/LibWithdrawPollStorage.sol";
import "../PollFacet/LibBasePollStorage.sol";
import "../RolesFacet/RolesView.sol";
import "../../interfaces/IAssetPool.sol";
import "./LibAssetPoolStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";

import "hardhat/console.sol";

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
        require(_withdrawAmount != 0, "NOT_VALID");
        require(_withdrawAmount != ENABLE_REWARD, "NOT_VALID");
        require(_withdrawAmount != DISABLE_REWARD, "NOT_VALID");
        LibAssetPoolStorage.Reward memory reward;

        reward.id = LibAssetPoolStorage.apStorage().rewards.length + 1;
        reward.state = LibAssetPoolStorage.RewardState.Disabled;
        reward.pollId = _createRewardPoll(
            reward.id,
            _withdrawAmount,
            _withdrawDuration
        );
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
    ) public override onlyOwner {
        // todo verify amount
        require(_isMember(_msgSender()), "NOT_MEMBER");
        LibAssetPoolStorage.Reward storage reward = LibAssetPoolStorage
            .apStorage()
            .rewards[_id - 1];

        // storage will be deleted (e.g. set to default) after poll is finalized
        require(reward.pollId == 0, "IS_NOT_FINALIZED");
        // setting both params to initial state is not allowed
        // this is a reserverd state for new rewards
        require(
            !(_withdrawAmount == 0 && _withdrawDuration == 0),
            "NOT_ALLOWED"
        );

        require(
            !(_withdrawAmount == ENABLE_REWARD &&
                reward.state == LibAssetPoolStorage.RewardState.Enabled),
            "ALREADY_ENABLED"
        );

        require(
            !(_withdrawAmount == DISABLE_REWARD &&
                reward.state == LibAssetPoolStorage.RewardState.Disabled),
            "ALREADY_DISABLED"
        );

        require(
            !(reward.withdrawAmount == _withdrawAmount &&
                reward.withdrawDuration == _withdrawDuration),
            "IS_EQUAL"
        );

        reward.pollId = _createRewardPoll(
            _id,
            _withdrawAmount,
            _withdrawDuration
        );
    }

    /**
     * @dev Creates a withdraw poll for a reward.
     * @param _id Reference id of the reward
     * @param _beneficiary Address of the beneficiary
     */
    function claimRewardFor(uint256 _id, address _beneficiary) public override {
        require(_isMember(_msgSender()), "NOT_MEMBER");
        require(_isMember(_beneficiary), "NOT_MEMBER");

        LibAssetPoolStorage.Reward memory current = LibAssetPoolStorage
            .apStorage()
            .rewards[_id - 1];

        require(
            current.state == LibAssetPoolStorage.RewardState.Enabled,
            "IS_NOT_ENABLED"
        );
        _createWithdrawPoll(
            current.withdrawAmount,
            current.withdrawDuration,
            _beneficiary
        );
    }

    /**
     * @dev Creates a withdraw poll for a reward.
     * @param _id Reference id of the reward
     */
    function claimReward(uint256 _id) public override {
        claimRewardFor(_id, _msgSender());
    }

    /**
     * @dev Creates a custom withdraw proposal.
     * @param _amount Size of the withdrawal
     * @param _beneficiary Address of the beneficiary
     */
    function proposeWithdraw(uint256 _amount, address _beneficiary)
        external
        override
    {
        // TODO verify amount
        require(_isMember(_msgSender()), "NOT_MEMBER");
        require(_isMember(_beneficiary), "NOT_MEMBER");

        _createWithdrawPoll(
            _amount,
            LibAssetPoolStorage.apStorage().proposeWithdrawPollDuration,
            _beneficiary
        );
    }

    /**
     * @dev Starts a withdraw poll.
     * @param _amount Size of the withdrawal
     * @param _duration The duration the withdraw poll
     * @param _beneficiary Beneficiary of the reward
     */
    function _createWithdrawPoll(
        uint256 _amount,
        uint256 _duration,
        address _beneficiary
    ) internal returns (uint256) {
        LibAssetPoolStorage.APstorage storage apst = LibAssetPoolStorage
            .apStorage();
        apst.pollCounter = apst.pollCounter + 1;


            LibBasePollStorage.BasePollStorage storage baseStorage
         = LibBasePollStorage.basePollStorageId(apst.pollCounter);

        baseStorage.id = apst.pollCounter;
        baseStorage.startTime = block.timestamp;
        baseStorage.endTime = block.timestamp + _duration;


            LibWithdrawPollStorage.WPStorage storage wpStorage
         = LibWithdrawPollStorage.wpStorageId(apst.pollCounter);

        wpStorage.amount = _amount;
        wpStorage.beneficiary = _beneficiary;

        emit WithdrawPollCreated(apst.pollCounter, _beneficiary);
        return baseStorage.id;
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
    ) internal returns (uint256) {
        LibAssetPoolStorage.APstorage storage apst = LibAssetPoolStorage
            .apStorage();
        apst.pollCounter = apst.pollCounter + 1;


            LibBasePollStorage.BasePollStorage storage baseStorage
         = LibBasePollStorage.basePollStorageId(apst.pollCounter);

        baseStorage.id = apst.pollCounter;
        baseStorage.startTime = block.timestamp;
        baseStorage.endTime = block.timestamp + apst.rewardPollDuration;

        LibRewardPollStorage.RPStorage storage rpStorage = LibRewardPollStorage
            .rpStorageId(apst.pollCounter);

        rpStorage.rewardIndex = _id - 1;
        rpStorage.withdrawAmount = _withdrawAmount;
        rpStorage.withdrawDuration = _withdrawDuration;

        emit RewardPollCreated(
            apst.pollCounter,
            _msgSender(),
            _id,
            _withdrawAmount
        );
        return baseStorage.id;
    }
}

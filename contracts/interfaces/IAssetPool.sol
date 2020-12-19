// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface IAssetPool {
    event WithdrawPollCreated(uint256 id, address indexed member);
    event RewardPollCreated(
        uint256 id,
        address indexed member,
        uint256 withdrawID,
        uint256 proposal
    );

    function initializeAssetPool(address _tokenAddress) external;

    function setProposeWithdrawPollDuration(uint256 _duration) external;

    function setRewardPollDuration(uint256 _duration) external;

    function addReward(uint256 _withdrawAmount, uint256 _withdrawDuration)
        external;

    function updateReward(
        uint256 _id,
        uint256 _withdrawAmount,
        uint256 _withdrawDuration
    ) external;

    function claimRewardFor(uint256 _id, address _beneficiary) external;

    function claimReward(uint256 _id) external;

    function proposeWithdraw(uint256 _amount, address _beneficiary) external;
}

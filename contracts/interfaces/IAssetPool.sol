// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface IAssetPool {
    function initializeAssetPool(address _tokenAddress) external;

    function setProposeWithdrawPollDuration(uint256 _duration) external;

    function setRewardPollDuration(uint256 _duration) external;

    function addReward(uint256 _withdrawAmount, uint256 _withdrawDuration)
        external;
}

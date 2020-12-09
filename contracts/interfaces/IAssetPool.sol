// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface IAssetPool {
    function initializeAssetPool(address _owner, address _tokenAddress)
        external;

    function getToken() external view returns (address);

    function setProposeWithdrawPollDuration(uint256 _duration) external;

    function getProposeWithdrawPollDuration() external view returns (uint256);

    function setRewardPollDuration(uint256 _duration) external;

    function getRewardPollDuration() external view returns (uint256);

    function addReward(uint256 _withdrawAmount, uint256 _withdrawDuration)
        external;
}

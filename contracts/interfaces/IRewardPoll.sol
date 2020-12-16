// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IRewardPoll {
    function getWithdrawAmount(uint256 _id) external view returns (uint256);

    function getWithdrawDuration(uint256 _id) external view returns (uint256);

    function getRewardIndex(uint256 _id) external view returns (uint256);
}

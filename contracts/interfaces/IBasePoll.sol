// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IBasePoll {
    function getStartTime(uint256 _id) external view returns (uint256);

    function getEndTime(uint256 _id) external view returns (uint256);
}

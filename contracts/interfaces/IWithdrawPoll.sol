// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IWithdrawPoll {
    function getBeneficiary(uint256 _id) external view returns (address);

    function getAmount(uint256 _id) external view returns (uint256);
}

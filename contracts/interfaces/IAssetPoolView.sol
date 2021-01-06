// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "../facets/AssetPoolFacet/LibAssetPoolStorage.sol";

interface IAssetPoolView {
    function getToken() external view returns (address);

    function getProposeWithdrawPollDuration() external view returns (uint256);

    function getRewardPollDuration() external view returns (uint256);

    function getReward(uint256 _id)
        external
        view
        returns (LibAssetPoolStorage.Reward memory);

    function getPollCounter() external view returns (uint256);
}

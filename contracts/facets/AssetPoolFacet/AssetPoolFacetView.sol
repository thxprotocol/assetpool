// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "diamond-2/contracts/libraries/LibDiamond.sol";
import "../PollFacet/LibRewardPollStorage.sol";
import "../PollFacet/LibBasePollStorage.sol";

import "../../interfaces/IAssetPoolView.sol";
import "./LibAssetPoolStorage.sol";

contract AssetPoolFacetView is IAssetPoolView {
    function getToken() public override view returns (address) {
        return address(LibAssetPoolStorage.apStorage().token);
    }

    function getProposeWithdrawPollDuration()
        public
        override
        view
        returns (uint256)
    {
        return LibAssetPoolStorage.apStorage().proposeWithdrawPollDuration;
    }

    function getRewardPollDuration() public override view returns (uint256) {
        return LibAssetPoolStorage.apStorage().rewardPollDuration;
    }

    function getPollCounter() public override view returns (uint256) {
        return LibAssetPoolStorage.apStorage().pollCounter;
    }

    function getReward(uint256 _id)
        public
        override
        view
        returns (LibAssetPoolStorage.Reward memory)
    {
        return LibAssetPoolStorage.apStorage().rewards[_id - 1];
    }
}

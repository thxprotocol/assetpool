// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";

contract RewardPollFacet {
    function setMeme(uint256 _id, uint256 _data) public {
        LibRewardPollStorage.rpStorage(_id).data = _data;
    }

    function getMeme(uint256 _id) public view returns (uint256) {
        return LibRewardPollStorage.rpStorage(_id).data;
    }
}

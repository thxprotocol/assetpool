// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./RewardPollFacet.sol";

contract RewardPollFacetBypass is RewardPollFacet {
    function _rewardPollApprovalState()
        public
        virtual
        override
        view
        isReward
        returns (bool)
    {
        return true;
    }

}

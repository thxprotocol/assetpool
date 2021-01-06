// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./WithdrawPollFacet.sol";

contract WithdrawPollFacetBypass is WithdrawPollFacet {
    function _withdrawPollApprovalState()
        public
        override
        view
        isWithdraw
        returns (bool)
    {
        return true;
    }
}

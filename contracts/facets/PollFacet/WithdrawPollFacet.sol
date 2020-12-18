// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";

contract WithdrawPollFacet is BasePoll, RolesView {
    function voteValidate(bool _agree, address _voter) internal override {
        require(_isMember(_voter), "NO_MEMBER");
    }

    /**
     * @dev callback called after poll finalization
     */
    function onPollFinish(uint256 _id) internal override {}

    function WithdrawPollVote(bool _agree) external {
        vote(_agree);
    }

    function WithdrawPollRevokeVote(bool _agree) external {
        revokeVote();
    }

    function WithdrawPollFinalize() external {
        finalize();
    }

    function WithdrawPollApprovalState() public view returns (bool) {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }
}

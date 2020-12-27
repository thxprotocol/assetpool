// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibWithdrawPollStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";

contract WithdrawPollFacet is BasePoll, RolesView {
    function voteValidate(bool _agree, address _voter) internal override {
        require(_isManager(_voter), "NO_MEMBER");
    }

    modifier isWithdraw {
        LibBasePollStorage.BasePollStorage storage bData = baseData();


            LibWithdrawPollStorage.WPStorage storage wpPollData
         = LibWithdrawPollStorage.wpStorageId(bData.id);

        require(wpPollData.beneficiary != address(0), "NOT_WITHDRAW_POLL");
        _;
    }

    /**
     * @dev callback called after poll finalization
     */
    function onPollFinish(uint256 _id) internal override {
        bool approved = _withdrawPollApprovalState();


            LibWithdrawPollStorage.WPStorage storage wpPollData
         = LibWithdrawPollStorage.wpStorageId(_id);

        if (approved) {
            IERC20 token = LibAssetPoolStorage.apStorage().token;

            token.transfer(wpPollData.beneficiary, wpPollData.amount);
            //emit Withdrawn(wpPollData.beneficiary, wpPollData.amount);
        }

        delete wpPollData.beneficiary;
        delete wpPollData.amount;
    }

    function _withdrawPollVote(bool _agree) external isWithdraw {
        vote(_agree);
    }

    function _withdrawPollRevokeVote() external isWithdraw {
        revokeVote();
    }

    function _withdrawPollFinalize() external isWithdraw {
        finalize();
    }

    function _withdrawPollApprovalState()
        public
        view
        isWithdraw
        returns (bool)
    {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }
}

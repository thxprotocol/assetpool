// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibWithdrawPollStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BasePoll.sol";
import "../RolesFacet/RolesView.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../../interfaces/IWithdrawPoll.sol";
import "../AssetPoolFacet/LibAssetPoolStorage.sol";

contract WithdrawPollFacet is IWithdrawPoll, BasePoll, RolesView {
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
            emit Withdrawn(_id, wpPollData.beneficiary, wpPollData.amount);
        }

        emit WithdrawPollFinalized(_id, approved);
        delete wpPollData.beneficiary;
        delete wpPollData.amount;
    }

    function getBeneficiary(uint256 _id)
        public
        override
        view
        returns (address)
    {
        return LibWithdrawPollStorage.wpStorageId(_id).beneficiary;
    }

    function getAmount(uint256 _id) public override view returns (uint256) {
        return LibWithdrawPollStorage.wpStorageId(_id).amount;
    }

    function _withdrawPollVote(bool _agree) external override isWithdraw {
        vote(_agree);
        emit WithdrawPollVoted( baseData().id, _msgSender(), _agree);
    }

    function _withdrawPollRevokeVote() external override isWithdraw {
        revokeVote();
        emit WithdrawPollRevokedVote(baseData().id, _msgSender());
    }

    function _withdrawPollFinalize() external override isWithdraw {
        finalize();
    }

    function _withdrawPollApprovalState()
        public
        virtual
        override
        view
        isWithdraw
        returns (bool)
    {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }
}

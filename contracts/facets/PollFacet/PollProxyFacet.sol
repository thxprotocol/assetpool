// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./LibRewardPollStorage.sol";
import "./LibWithdrawPollStorage.sol";
import "./LibBasePollStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../../interfaces/IRewardPoll.sol";
import "../../interfaces/IWithdrawPoll.sol";
import "../../interfaces/IBasePoll.sol";

contract PollProxyFacet is
    IBasePoll,
    IRewardPoll,
    IWithdrawPoll,
    RelayReceiver
{
    // BasePoll
    function getStartTime(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).startTime;
    }

    function getEndTime(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).endTime;
    }

    function getYesCounter(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).yesCounter;
    }

    function getNoCounter(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).noCounter;
    }

    function getTotalVoted(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).totalVoted;
    }

    function getVotesByAddress(uint256 _id, address _address)
        public
        override
        view
        returns (LibBasePollStorage.Vote memory)
    {
        return
            LibBasePollStorage.basePollStorageId(_id).votesByAddress[_address];
    }

    // Rewardpoll
    function getRewardIndex(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).rewardIndex;
    }

    function getWithdrawAmount(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).withdrawAmount;
    }

    function getWithdrawDuration(uint256 _id)
        public
        override
        view
        returns (uint256)
    {
        return LibRewardPollStorage.rpStorageId(_id).withdrawDuration;
    }

    //withdraw poll

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
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./LibRewardPollStorage.sol";
import "./LibWithdrawPollStorage.sol";
import "./LibBasePollStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";

import "../../interfaces/IBasePoll.sol";

contract PollProxyFacet is
    IBasePoll,
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

}
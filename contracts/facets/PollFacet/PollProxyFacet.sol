// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "./LibBasePollStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../../interfaces/IRewardPoll.sol";
import "../../interfaces/IBasePoll.sol";

contract PollProxyFacet is IBasePoll, IRewardPoll, RelayReceiver {
    event Data(bytes32 pos);

    function getStartTime(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).startTime;
    }

    function getEndTime(uint256 _id) public override view returns (uint256) {
        return LibBasePollStorage.basePollStorageId(_id).endTime;
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
}

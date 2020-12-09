// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../../interfaces/IRewardPoll.sol";

contract PollProxyFacet is IRewardPoll, RelayReceiver {
    event Data(bytes32 pos);

    function getEndTime(uint256 _id) public override view returns (uint256) {
        return LibRewardPollStorage.rpStorageId(_id).endtime;
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

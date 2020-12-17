// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "./LibBasePollStorage.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

abstract contract BasePoll is RelayReceiver {
    using SafeMath for uint256;

    modifier checkTime() {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        require(
            block.timestamp >= bData.startTime &&
                block.timestamp <= bData.endTime,
            "IS_NO_VALID_TIME"
        );
        _;
    }

    /**
     * Finalize poll and call onPollFinish callback with result
     */
    function finalize() public {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        require(block.timestamp >= bData.endTime, "WRONG_STATE");
        onPollFinish(bData.id);
        delete bData.id;
        delete bData.startTime;
        delete bData.endTime;
        delete bData.yesCounter;
        delete bData.noCounter;
        delete bData.totalVoted;
        //delete bData.votesByAddress;
    }

    function onPollFinish(uint256 _id) internal virtual;

    function _getCurrentApprovalState() public view returns (bool) {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }

    /**
     * @dev callback called after poll finalization
     * @param _agree True if user endorses the proposal else False
     */
    function vote(bool _agree) external virtual;

    /**
     * @dev Process user`s vote
     * @param _agree True if user endorses the proposal else False
     * @param _voter The address of the voter
     */
    function _vote(bool _agree, address _voter) internal checkTime {
        LibBasePollStorage.BasePollStorage storage bData = baseData();

        require(bData.votesByAddress[_voter].time == 0, "HAS_VOTED");
        uint256 voiceWeight = 1;

        if (_agree) {
            bData.yesCounter = bData.yesCounter.add(voiceWeight);
        } else {
            bData.noCounter = bData.noCounter.add(voiceWeight);
        }

        bData.votesByAddress[_voter].time = block.timestamp;
        bData.votesByAddress[_voter].weight = voiceWeight;
        bData.votesByAddress[_voter].agree = _agree;

        bData.totalVoted = bData.totalVoted.add(1);
    }

    /**
     * @dev Revoke user`s vote
     */
    function revokeVote() external checkTime {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        address _voter = _msgSender();

        require(bData.votesByAddress[_voter].time > 0, "HAS_NOT_VOTED");

        uint256 voiceWeight = bData.votesByAddress[_voter].weight;
        bool agree = bData.votesByAddress[_voter].agree;

        bData.votesByAddress[_voter].time = 0;
        bData.votesByAddress[_voter].weight = 0;
        bData.votesByAddress[_voter].agree = false;

        bData.totalVoted = bData.totalVoted.sub(1);
        if (agree) {
            bData.yesCounter = bData.yesCounter.sub(voiceWeight);
        } else {
            bData.noCounter = bData.noCounter.sub(voiceWeight);
        }
    }

    function baseData()
        internal
        pure
        returns (LibBasePollStorage.BasePollStorage storage)
    {
        return LibBasePollStorage.basePollStorage(bps());
    }

    function bps() internal pure returns (bytes32 rt) {
        // These fields are not accessible from assembly
        bytes memory array = msg.data;
        // minus address space
        uint256 index = msg.data.length - 20;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            rt := mload(add(array, index))
        }
    }
}

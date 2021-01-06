// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./LibRewardPollStorage.sol";
import "./LibWithdrawPollStorage.sol";
import "./LibBasePollStorage.sol";
import "../../interfaces/IRewardPollFacet.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract RewardPollProxyFacet is IRewardPollFacet, RelayReceiver
{

    function rewardPollVote(uint256 _id, bool _agree) external override {
         bytes32 position = LibBasePollStorage.getPosition(_id);
        bytes4 sig = bytes4(keccak256("_rewardPollVote(bool)"));
        bytes memory _call = abi.encodeWithSelector(sig, _agree);

        (bool success, bytes memory data) = address(this).call(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, string(data));
    }

    function rewardPollRevokeVote(uint256 _id) external override {
         bytes32 position = LibBasePollStorage.getPosition(_id);
        bytes4 sig = bytes4(keccak256("_rewardPollRevokeVote()"));
        bytes memory _call = abi.encodeWithSelector(sig);

        (bool success, bytes memory data) = address(this).call(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, string(data));
    }

    function rewardPollFinalize(uint256 _id) external override {
        bytes32 position = LibBasePollStorage.getPosition(_id);
        bytes4 sig = bytes4(keccak256("_rewardPollFinalize()"));
        bytes memory _call = abi.encodeWithSelector(sig);

        (bool success, bytes memory data) = address(this).call(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, string(data));
    }

    function rewardPollApprovalState(uint256 _id) external override view returns (bool) {
        bytes32 position = LibBasePollStorage.getPosition(_id);
        bytes4 sig = bytes4(keccak256("_rewardPollApprovalState()"));
        bytes memory _call = abi.encodeWithSelector(sig);

        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, string(data));
        return abi.decode(data, (bool));
    }
}

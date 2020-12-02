// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract RewardPollFacet is RelayReceiver {
    function _setMeme(uint256 _data) public {
        bytes32 pointer = rps();
        LibRewardPollStorage.rpStorage(pointer).data = _data;
    }

    function _getMeme() public view returns (uint256) {
        uint256 d = LibRewardPollStorage.rpStorage(rps()).data;
        bytes32 pointer = rps();
        return d;
    }

    function rps() internal view returns (bytes32 rt) {
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

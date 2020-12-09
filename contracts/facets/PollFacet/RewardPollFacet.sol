// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

contract RewardPollFacet is RelayReceiver {
    event Sender(address sender);

    // needed for tests to run
    function test() public {}

    function rps() internal pure returns (bytes32 rt) {
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

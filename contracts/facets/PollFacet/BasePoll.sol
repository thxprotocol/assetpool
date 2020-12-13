// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibBasePollStorage.sol";
import "hardhat/console.sol";
import "../GasStationFacet/RelayReceiver.sol";

abstract contract BasePoll is RelayReceiver {
    function _getCurrentApprovalState() public view returns (bool) {
        LibBasePollStorage.BasePollStorage storage bData = baseData();
        return bData.yesCounter > bData.noCounter;
    }

    function baseData() internal pure returns (LibBasePollStorage.BasePollStorage storage) {
        return LibBasePollStorage.basePollStorage(rps());
    }

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
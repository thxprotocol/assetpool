// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../GasStationFacet/RelayReceiver.sol";

contract AssetPoolFacet is RelayReceiver {
    event Address(address user);

    function test() public {
        emit Address(_msgSender());
    }
}

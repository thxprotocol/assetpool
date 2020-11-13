// SPDX-License-Identifier: Apache-2.0
import "diamond-2/contracts/interfaces/IERC173.sol";
import "diamond-2/contracts/interfaces/IDiamondLoupe.sol";
import "diamond-2/contracts/interfaces/IDiamondCut.sol";
import "./IGasStation.sol";

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface IAssetPoolFacet is IERC173, IDiamondLoupe, IDiamondCut, IGasStation {
    event Address(address meme);

    function test() external;
}

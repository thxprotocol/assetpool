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

    function getMeme(uint256 _id) external view returns (uint256);

    function setMeme(uint256 _id, uint256 _data) external;

   // function setMeme(uint256 _data) external;

  // function getMeme() external view returns (uint256);

    function callContract(uint256 _id, bytes memory _call) external;

    function viewContract(uint256 _id, bytes memory _call) external view;

    function contractVote() external;
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "./LibRewardPollStorage.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "./LibRewardPollStorage.sol";
import "hardhat/console.sol";

contract PollProxyFacet is RelayReceiver {
    event Data(bytes32 pos);

    function getMeme(uint256 _id) public view returns (uint256) {
        bytes32 position = keccak256(abi.encode(_id));
        bytes4 sig = bytes4(keccak256("_getMeme()"));
        bytes memory _call = abi.encodeWithSelector(sig);
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, "fail");
        return abi.decode(data, (uint256));
    }

    function setMeme(uint256 _id, uint256 _data) public {
        bytes32 position = keccak256(abi.encode(_id));
        bytes4 sig = bytes4(keccak256("_setMeme(uint256)"));
        bytes memory _call = abi.encodeWithSelector(sig, _data);
        (bool success, bytes memory data) = address(this).call(
            abi.encodePacked(_call, position, _msgSender())
        );
        require(success, "fail");
    }
}

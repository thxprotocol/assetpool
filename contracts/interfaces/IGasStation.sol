// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IGasStation {
    event Result(bool success, bytes data);

    function initialize(address _admin) external;

    function getAdmin() external view returns (address);

    function getLatestNonce(address _signer) external view returns (uint256);

    function call(
        bytes calldata _call,
        address _to,
        uint256 _nonce,
        bytes memory _sig
    ) external;
}

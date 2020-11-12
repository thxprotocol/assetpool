// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

library LibGasStationStorage {
  bytes32 constant GASSTATION_STORAGE_POSITION = keccak256(
    "diamond.standard.gasstation.storage"
  );

  struct GSStorage {
    address admin;
    mapping(address => uint256) signerNonce;
    uint256 lockCounter;
  }

  function gsStorage() internal pure returns (GSStorage storage bs) {
    bytes32 position = GASSTATION_STORAGE_POSITION;
    assembly {
      bs.slot := position
    }
  }
}
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

library LibWithdrawPollStorage {
  struct WPStorage {
      uint256 beneficiary;
      uint256 amount;
  }

  function getPosition(uint256 _id) internal pure returns (bytes32) {
        return keccak256(abi.encode("diamond.contract.assetpool.withdrawdpoll", _id));
    }

  function wpStorage(bytes32 _pos) internal pure returns (WPStorage storage bs) {
    assembly {
      bs.slot := _pos
    }
  }

  function wpStorageId(uint256 _id) internal pure returns (WPStorage storage bs) {
    bytes32 position = getPosition(_id);
    assembly {
      bs.slot := position
    }
  }
}
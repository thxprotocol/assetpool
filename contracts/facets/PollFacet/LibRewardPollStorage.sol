// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

library LibRewardPollStorage {
struct RPStorage {
    uint256 data;
  }

  function rpStorage(uint256 _id) internal pure returns (RPStorage storage bs) {
    bytes32 position = keccak256(abi.encode(_id));
    assembly {
      bs.slot := position
    }
  }
}
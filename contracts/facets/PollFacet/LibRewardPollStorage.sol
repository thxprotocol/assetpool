// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

library LibRewardPollStorage {
struct RPStorage {
    uint256 data;
  }

  function rpStorage(bytes32 _pos) internal pure returns (RPStorage storage bs) {
    assembly {
      bs.slot := _pos
    }
  }
}
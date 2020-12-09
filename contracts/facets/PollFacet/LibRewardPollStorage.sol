// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

library LibRewardPollStorage {
  struct RPStorage {
    uint256 id;
    uint256 withdrawAmount;
    uint256 withdrawDuration;
    uint256 endtime;
    address poolAddress;
    address gasStation;
  }
  function getPosition(uint256 _id) internal pure returns (bytes32) {
        return
            keccak256(abi.encode("diamond.contract.assetpool.rewardpoll", _id));
    }

  function rpStorage(bytes32 _pos) internal pure returns (RPStorage storage bs) {
    assembly {
      bs.slot := _pos
    }
  }

  function rpStorageId(uint256 _id) internal pure returns (RPStorage storage bs) {
    bytes32 position = getPosition(_id);
    assembly {
      bs.slot := position
    }
  }
}
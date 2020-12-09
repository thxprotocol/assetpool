// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";

library LibAssetPoolStorage {
    bytes32 constant GASSTATION_STORAGE_POSITION = keccak256(
        "diamond.standard.assetpool.storage"
    );

    struct APstorage {
        address owner;
        IERC20 token;
        mapping(bytes32 => RoleData) roles;

        uint256 proposeWithdrawPollDuration;
        uint256 rewardPollDuration;
        Reward[] rewards;
    }

    struct RoleData {
        EnumerableSet.AddressSet members;
        bytes32 adminRole;
    }

    enum RewardState { Disabled, Enabled }

    struct Reward {
        uint256 id;
        uint256 withdrawAmount;
        uint256 withdrawDuration;
        RewardState state;
    }

    function apStorage() internal pure returns (APstorage storage bs) {
        bytes32 position = GASSTATION_STORAGE_POSITION;
        assembly {
            bs.slot := position
        }
    }
}
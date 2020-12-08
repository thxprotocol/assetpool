// SPDX-License-Identifier: Apache-2.0
import "diamond-2/contracts/interfaces/IERC173.sol";
import "diamond-2/contracts/interfaces/IDiamondLoupe.sol";
import "diamond-2/contracts/interfaces/IDiamondCut.sol";
import "./IGasStation.sol";

pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

interface IAssetPoolFacet is IERC173, IDiamondLoupe, IDiamondCut, IGasStation {
    function initializeAssetPool(address _owner, address _tokenAddress)
        external;

    function getToken() external view returns (address);

    // Roles
    function getOwner() external view returns (address);

    function removeManager(address _account) external;

    function isManager(address _account) external view returns (bool);

    function addManager(address _account) external;

    function removeMember(address _account) external;

    function isMember(address _account) external view returns (bool);

    function addMember(address _account) external;

    function __Roles_init(address _owner) external;
}

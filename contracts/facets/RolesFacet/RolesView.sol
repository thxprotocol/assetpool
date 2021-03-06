// contracts/AssetPool.sol
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;

import "./AccessControlView.sol";
import "diamond-2/contracts/libraries/LibDiamond.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "./LibAccessStorage.sol";

contract RolesView is AccessControlView {
    bytes32 internal constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 internal constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(LibDiamond.contractOwner() == _msgSender(), "NOT_OWNER");
        _;
    }

    modifier onlyManager() {
        require(
            hasRole(
                MANAGER_ROLE,
                LibAccessStorage.roleStorage().addressToMember[_msgSender()]
            ),
            "NOT_MANAGER"
        );
        _;
    }

    modifier onlyMember() {
        require(
            hasRole(
                MEMBER_ROLE,
                LibAccessStorage.roleStorage().addressToMember[_msgSender()]
            ),
            "NOT_MEMBER"
        );
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function _getOwner() internal view returns (address) {
        return LibDiamond.contractOwner();
    }

    /**
     * @dev Verifies the account has a MANAGER_ROLE
     * @param _account Address of the owner of the asset pool
     */
    function _isManager(address _account) internal view returns (bool) {
        return
            hasRole(
                MANAGER_ROLE,
                LibAccessStorage.roleStorage().addressToMember[_account]
            );
    }

    /**
     * @dev Verifies the account has a MEMBER_ROLE
     * @param _account A member address
     */
    function _isMember(address _account) internal view returns (bool) {
        uint256 member = LibAccessStorage
            .roleStorage()
            .addressToMember[_account];
        return hasRole(MEMBER_ROLE, member) || hasRole(MANAGER_ROLE, member);
    }
}

// contracts/AssetPool.sol
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;

import "./AccessControl.sol";
import "./RolesView.sol";
import "../../interfaces/IRoles.sol";

contract RolesFacet is IRoles, RolesView, AccessControl {
    function isManager(address _account) public override view returns (bool) {
        return _isManager(_account);
    }

    function isMember(address _account) public override view returns (bool){
        return _isMember(_account);
    }

    function getOwner() public override view returns (address){
        return _getOwner();
    }

    /**
     * @dev Initializes the asset pool and sets the owner. Called when contract upgrades are available.
     * @param _owner Address of the owner of the asset pool
     */
    function initializeRoles(address _owner) public override {
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(MEMBER_ROLE, _owner);
        _setupRole(MANAGER_ROLE, _owner);
    }

    /**
     * @dev Grants member role and adds address to member list
     * @param _account A valid address
     */
    function addMember(address _account) public override onlyMember {
        grantRole(MEMBER_ROLE, _account);
    }

    /**
     * @dev Revokes role and sets member address to false in list.
     * @param _account A member address
     */
    function removeMember(address _account) public override onlyManager {
        revokeRole(MEMBER_ROLE, _account);
    }

    /**
     * @dev Grants manager role and adds address to manager list
     * @param _account A member address
     */
    function addManager(address _account) public override onlyManager {
        grantRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Revokes role and sets manager address to false in list.
     * @param _account Address of the owner of the asset pool
     */
    function removeManager(address _account) public override onlyManager {
        require(msg.sender != _account, "OWN_ACCOUNT");
        revokeRole(MANAGER_ROLE, _account);
    }
}

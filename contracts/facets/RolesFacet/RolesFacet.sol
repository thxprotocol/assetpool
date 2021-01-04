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

    function isMember(address _account) public override view returns (bool) {
        return _isMember(_account);
    }

    function isManagerRoleAdmin(address _account)
        public
        override
        view
        returns (bool)
    {
        return
            hasRole(
                getRoleAdmin(MANAGER_ROLE),
                LibAccessStorage.roleStorage().addressToMember[_account]
            );
    }

    function isMemberRoleAdmin(address _account)
        public
        override
        view
        returns (bool)
    {
        return
            hasRole(
                getRoleAdmin(MEMBER_ROLE),
                LibAccessStorage.roleStorage().addressToMember[_account]
            );
    }

    function getOwner() public override view returns (address) {
        return _getOwner();
    }

    /**
     * @dev Initializes the asset pool and sets the owner. Called when contract upgrades are available.
     * @param _owner Address of the owner of the asset pool
     */
    function initializeRoles(address _owner) public override {
        LibAccessStorage.roleStorage().memberCounter = 1000;
        setupMember(_owner);
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(MEMBER_ROLE, _owner);
        _setupRole(MANAGER_ROLE, _owner);
    }

    /**
     * @dev Grants member role and adds address to member list
     * @param _account A valid address
     */
    function addMember(address _account) public override {
        setupMember(_account);
        grantRole(MEMBER_ROLE, _account);
    }

    /**
     * @dev Revokes role and sets member address to false in list.
     * @param _account A member address
     */
    function removeMember(address _account) public override {
        revokeRole(MEMBER_ROLE, _account);
    }

    /**
     * @dev Grants manager role and adds address to manager list
     * @param _account A member address
     */
    function addManager(address _account) public override {
        setupMember(_account);
        grantRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Revokes role and sets manager address to false in list.
     * @param _account Address of the owner of the asset pool
     */
    function removeManager(address _account) public override {
        require(_msgSender() != _account, "OWN_ACCOUNT");
        revokeRole(MANAGER_ROLE, _account);
    }

    // TODO deleteMember is tricky, definitely do not include in removeManager / removeMember. As it is will result in unwanted behaviour
    // consider keeping the member mappings, if an 'old', address is joining again, the same member id is kept
    // and include an deleteMe function which deleted the member, optional call for the member

    // TODO, consider grantRole, revokeRole, renounceRole with memberid instead of address (or both)

    function setupMember(address _account) internal {
        LibAccessStorage.RoleStorage storage rs = LibAccessStorage
            .roleStorage();
        uint256 member = rs.addressToMember[_account];
        if (member != 0) {
            return;
        }
        rs.memberCounter += 1;
        rs.addressToMember[_account] = rs.memberCounter;
        rs.memberToAddress[rs.memberCounter] = _account;
    }

    function upgradeAddress(address _newAddress) public {
        LibAccessStorage.RoleStorage storage rs = LibAccessStorage
            .roleStorage();
        uint256 member = rs.addressToMember[_msgSender()];
        require(member != 0, "NON_MEMBER");
        rs.addressToMember[_newAddress] = member;
        rs.memberToAddress[member] = _newAddress;
    }

    function getAddressByMember(uint256 _member)
        external
        view
        returns (address)
    {
        return LibAccessStorage.roleStorage().memberToAddress[_member];
    }

    function getMemberByAddress(address _address)
        external
        view
        returns (uint256)
    {
        return LibAccessStorage.roleStorage().addressToMember[_address];
    }
}

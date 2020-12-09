// contracts/AssetPool.sol
// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.7.4;

import "./AccessControl.sol";
import "../../interfaces/IRoles.sol";

contract Roles is IRoles, AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /**
     * @dev Initializes the asset pool and sets the owner. Called when contract upgrades are available.
     * @param _owner Address of the owner of the asset pool
     */
    function __Roles_init(address _owner) public override {
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(MEMBER_ROLE, _owner);
        _setupRole(MANAGER_ROLE, _owner);
    }

    modifier onlyMember() {
        require(
            hasRole(MEMBER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "NOT_MEMBER"
        );
        _;
    }

    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "NOT_MANAGER"
        );
        _;
    }

    /**
     * @dev Grants member role and adds address to member list
     * @param _account A valid address
     */
    function addMember(address _account) public override onlyMember {
        grantRole(MEMBER_ROLE, _account);
    }

    /**
     * @dev Verifies the account has a MEMBER_ROLE
     * @param _account A member address
     */
    function isMember(address _account) public override view returns (bool) {
        return
            hasRole(MEMBER_ROLE, _account) || hasRole(MANAGER_ROLE, _account);
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
     * @dev Verifies the account has a MANAGER_ROLE
     * @param _account Address of the owner of the asset pool
     */
    function isManager(address _account) public override view returns (bool) {
        return hasRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Revokes role and sets manager address to false in list.
     * @param _account Address of the owner of the asset pool
     */
    function removeManager(address _account) public override onlyManager {
        require(msg.sender != _account, "OWN_ACCOUNT");
        revokeRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function getOwner() public override view returns (address) {
        return LibAssetPoolStorage.apStorage().owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(
            LibAssetPoolStorage.apStorage().owner == msg.sender,
            "NOT_OWNER"
        );
        _;
    }
}

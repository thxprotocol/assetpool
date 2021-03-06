// SPDX-License-Identifier: MIT
// source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./LibAccessStorage.sol";
import "./AccessControlView.sol";
import "../GasStationFacet/RelayReceiver.sol";
import "../../interfaces/IAccessControl.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it.
 */
abstract contract AccessControl is IAccessControl, AccessControlView {
    using EnumerableSet for EnumerableSet.UintSet;
    using Address for address;
    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) public virtual override {
        require(
            hasRole(
                LibAccessStorage.roleStorage().roles[role].adminRole,
                LibAccessStorage.roleStorage().addressToMember[_msgSender()]
            ),
            "AccessControl: sender must be an admin to grant"
        );

        _grantRole(
            role,
            LibAccessStorage.roleStorage().addressToMember[account]
        );
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) public virtual override {
        require(
            hasRole(
                LibAccessStorage.roleStorage().roles[role].adminRole,
                LibAccessStorage.roleStorage().addressToMember[_msgSender()]
            ),
            "AccessControl: sender must be an admin to revoke"
        );

        _revokeRole(
            role,
            LibAccessStorage.roleStorage().addressToMember[account]
        );
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account)
        public
        virtual
        override
    {
        require(
            account == _msgSender(),
            "AccessControl: can only renounce roles for self"
        );

        _revokeRole(
            role,
            LibAccessStorage.roleStorage().addressToMember[account]
        );
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     */
    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(
            role,
            LibAccessStorage.roleStorage().addressToMember[account]
        );
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        emit RoleAdminChanged(
            role,
            LibAccessStorage.roleStorage().roles[role].adminRole,
            adminRole
        );
        LibAccessStorage.roleStorage().roles[role].adminRole = adminRole;
    }

    function _grantRole(bytes32 role, uint256 _member) private {
        require(_member != 0, "NOT_SETUP");
        if (LibAccessStorage.roleStorage().roles[role].members.add(_member)) {
            emit RoleGranted(role, _member, _msgSender());
        }
    }

    function _revokeRole(bytes32 role, uint256 _member) private {
        require(_member != 0, "NOT_SETUP");
        if (
            LibAccessStorage.roleStorage().roles[role].members.remove(_member)
        ) {
            emit RoleRevoked(role, _member, _msgSender());
        }
    }
}

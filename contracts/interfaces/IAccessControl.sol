// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IAccessControl {
    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;
}

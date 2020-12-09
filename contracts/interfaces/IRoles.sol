// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IRoles {
    function getOwner() external view returns (address);

    function removeManager(address _account) external;

    function isManager(address _account) external view returns (bool);

    function addManager(address _account) external;

    function removeMember(address _account) external;

    function isMember(address _account) external view returns (bool);

    function addMember(address _account) external;

    function __Roles_init(address _owner) external;
}

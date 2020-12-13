// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

interface IRoles {

    function initializeRoles(address _owner) external;

    function removeManager(address _account) external;

    function addManager(address _account) external;

    function removeMember(address _account) external;

    function addMember(address _account) external;

    function isManager(address _account) external view returns (bool);

    function isMember(address _account) external view returns (bool);
    
    function getOwner() external view returns (address);

}

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Roles.sol";

contract AssetPoolFacet is Roles {
    function initializeAssetPool(address _owner, address _tokenAddress) public {
        LibAssetPoolStorage.APstorage storage s = LibAssetPoolStorage
            .apStorage();
        s.owner = _owner;
        s.token = IERC20(_tokenAddress);
    }

    function getToken() public view returns (address) {
        return address(LibAssetPoolStorage.apStorage().token);
    }
}

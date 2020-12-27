// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "../RelayDiamond.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "diamond-2/contracts/interfaces/IDiamondCut.sol";

import "../interfaces/ISolution.sol";

contract AssetPoolFactory is Ownable {

    event AssetPoolDeployed(address assetPool);
    address public defaultController;

    address[] public assetPools;
    mapping(address => bool) public isAssetPool;

    IDiamondCut.FacetCut[] public defaultCut;

    constructor(IDiamondCut.FacetCut[] memory _facets) {
        defaultController = msg.sender;
        for (uint256 i; i < _facets.length; i++) {
            defaultCut.push(_facets[i]);
        }
    }

    function setDefaultController(address _controller) external onlyOwner {
        defaultController = _controller;
    }

    function removeFacet(uint256 _index) external onlyOwner {
        defaultCut[_index] = defaultCut[defaultCut.length - 1];
        defaultCut.pop();
    }

    function addFacet(IDiamondCut.FacetCut memory _facet) external onlyOwner {
        defaultCut.push(_facet);
    }

    function deployAssetPool(address _api, address _owner, address _token) external onlyOwner {
        RelayDiamond d = new RelayDiamond(defaultCut, address(this));
        ISolution assetPool = ISolution(address(d));

        // initialize gasstation
        assetPool.initializeGasStation(_api);
        assetPool.initializeAssetPool(_token);
        assetPool.initializeRoles(_owner);
        assetPool.transferOwnership(defaultController);

        assetPools.push(address(d));
        isAssetPool[address(d)] = true;
        emit AssetPoolDeployed(address(d));
    }
}

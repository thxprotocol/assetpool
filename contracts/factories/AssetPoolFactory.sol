// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

import "diamond-2/contracts/Diamond.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IAssetPoolFacet.sol";

contract AssetPoolFactory is Ownable {

    event AssetPoolDeployed(address assetPool);
    address public defaultController;
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

    function deployAssetPool(address api) external {
        Diamond d = new Diamond(defaultCut, address(this));
        IAssetPoolFacet assetPool = IAssetPoolFacet(address(d));

        // initialize gasstation
        assetPool.initialize(api);
        assetPool.transferOwnership(defaultController);
        emit AssetPoolDeployed(address(d));
    }
}

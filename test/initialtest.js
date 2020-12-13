const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { utils } = require("ethers/lib");
const { ethers } = require("hardhat");

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

function getSelectors(contract) {
  const signatures = [];
  for (const key of Object.keys(contract.functions)) {
    signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
  }

  return signatures;
}

describe("Happyflow", function () {
  beforeEach(async function () {
    [owner, voter] = await ethers.getSigners();
    AssetPoolFacet = await ethers.getContractFactory("AssetPoolFacet");
    DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
    OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    GasStationFacet = await ethers.getContractFactory("GasStationFacet");
    RewardPollFacet = await ethers.getContractFactory("RewardPollFacet");
    PollProxyFacet = await ethers.getContractFactory("PollProxyFacet");

    AssetPoolFactory = await ethers.getContractFactory("AssetPoolFactory");

    assetPoolFacet = await AssetPoolFacet.deploy();
    diamondCutFacet = await DiamondCutFacet.deploy();
    diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    ownershipFacet = await OwnershipFacet.deploy();
    gasStationFacet = await GasStationFacet.deploy();
    rewardPollFacet = await RewardPollFacet.deploy();
    pollProxyFacet = await PollProxyFacet.deploy();

    diamondCut = [
      {
        action: FacetCutAction.Add,
        facetAddress: assetPoolFacet.address,
        functionSelectors: getSelectors(assetPoolFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: diamondCutFacet.address,
        functionSelectors: getSelectors(diamondCutFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: diamondLoupeFacet.address,
        functionSelectors: getSelectors(diamondLoupeFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: ownershipFacet.address,
        functionSelectors: getSelectors(ownershipFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: gasStationFacet.address,
        functionSelectors: getSelectors(gasStationFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: rewardPollFacet.address,
        functionSelectors: getSelectors(rewardPollFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: pollProxyFacet.address,
        functionSelectors: getSelectors(pollProxyFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: assetPoolFacetView.address,
        functionSelectors: getSelectors(assetPoolFacetView),
      },
    ];
    //console.error(diamondCut)
    // all = []
    // for (facet in diamondCut) {
    //     for (func in diamondCut[facet].functionSelectors) {
    //         const elem  = diamondCut[facet].functionSelectors[func]
    //         if (all.includes(elem)) {
    //             console.error("facet", facet, "func", elem)
    //             for(const key of Object.keys(gasStationFacet.functions)) {
    //                 console.error(key)
    //                 console.error(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    //             }
    //             break
    //         }
    //         all.push(elem)
    //     }
    // }
    assetPoolFactory = await AssetPoolFactory.deploy(diamondCut);
    tx = await assetPoolFactory.deployAssetPool(
      await owner.getAddress(),
      await owner.getAddress(),
      await owner.getAddress()
    );
    tx = await tx.wait();
    diamond = tx.events[tx.events.length - 1].args.assetPool;

    solution = await ethers.getContractAt("ISolution", diamond);
  });

  it("test storage", async () => {
    expect(await solution.getOwner()).to.eq(await owner.getAddress());
    expect(await solution.getToken()).to.eq(await owner.getAddress());
  });
  it("test reward poll", async () => {
    tx = await solution.addReward(100, 200);
    tx = tx.wait();
    const rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
      .timestamp;

    expect(await solution.getEndTime(0)).to.eq(rewardTimestamp);
    expect(await solution.getWithdrawAmount(0)).to.eq(100);
    expect(await solution.getWithdrawDuration(0)).to.eq(200);
  });
});

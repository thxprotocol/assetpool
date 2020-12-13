const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { parseEther } = require("ethers/lib/utils");
const { helpSign, FacetCutAction, getSelectors } = require("./utils.js");

const RewardState = {
  Disabled: 0,
  Enabled: 1,
};

const ENABLE_REWARD = BigNumber.from("2").pow(250);
const DISABLE_REWARD = BigNumber.from("2").pow(251);
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Test AddReward", function () {
  let solution;

  let gasStation;
  let owner;
  let voter;
  let token;
  let assetPool;
  let reward;
  let rewardPoll;
  let _beforeDeployment;

  let voteTx;
  let finalizeTx;

  before(
    (_beforeDeployment = async function () {
      [owner, voter] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));

      AssetPoolFacet = await ethers.getContractFactory("AssetPoolFacet");
      AssetPoolFacetView = await ethers.getContractFactory(
        "AssetPoolFacetView"
      );
      RolesFacet = await ethers.getContractFactory("RolesFacet");
      DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
      DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
      OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
      GasStationFacet = await ethers.getContractFactory("GasStationFacet");
      RewardPollFacet = await ethers.getContractFactory("RewardPollFacet");
      PollProxyFacet = await ethers.getContractFactory("PollProxyFacet");

      AssetPoolFactory = await ethers.getContractFactory("AssetPoolFactory");

      assetPoolFacet = await AssetPoolFacet.deploy();
      assetPoolFacetView = await AssetPoolFacetView.deploy();
      rolesFacet = await RolesFacet.deploy();
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
        {
          action: FacetCutAction.Add,
          facetAddress: rolesFacet.address,
          functionSelectors: getSelectors(rolesFacet),
        },
      ];
      assetPoolFactory = await AssetPoolFactory.deploy(diamondCut);
    })
  );
  describe("Add reward", async function () {
    before(async function () {
      await _beforeDeployment;
      tx = await assetPoolFactory.deployAssetPool(
        await owner.getAddress(),
        await owner.getAddress(),
        await owner.getAddress()
      );
      tx = await tx.wait();
      diamond = tx.events[tx.events.length - 1].args.assetPool;

      solution = await ethers.getContractAt("ISolution", diamond);
      await solution.addManager(voter.getAddress());
      await solution.setProposeWithdrawPollDuration(180);
      await solution.setRewardPollDuration(180);

      await token.transfer(solution.address, parseEther("1000"));
    });
    it("ENABLE_REWARD magic number", async function () {
      await expect(solution.addReward(ENABLE_REWARD, 180)).to.be.revertedWith(
        "NOT_VALID"
      );
    });
    it("DISABLE_REWARD magic number", async function () {
      await expect(solution.addReward(DISABLE_REWARD, 180)).to.be.revertedWith(
        "NOT_VALID"
      );
    });
    it("Test setRewardPollDuration", async function () {
      await solution.setRewardPollDuration(300);
      tx = await solution.addReward(parseEther("1"), 200);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      expect(await solution.getStartTime(0)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(0)).to.eq(rewardTimestamp + 300);

      await solution.setRewardPollDuration(900);
      //   // does not affect current polls
      expect(await solution.getStartTime(0)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(0)).to.eq(rewardTimestamp + 300);

      tx = await solution.addReward(parseEther("1"), 200);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(1)).to.eq(rewardTimestamp + 900);
    });
  });
  describe.only("Existing reward", async function () {
    before(async function () {
      await _beforeDeployment;
      tx = await assetPoolFactory.deployAssetPool(
        await owner.getAddress(),
        await owner.getAddress(),
        await owner.getAddress()
      );
      tx = await tx.wait();
      diamond = tx.events[tx.events.length - 1].args.assetPool;
      solution = await ethers.getContractAt("ISolution", diamond);
      await solution.addManager(voter.getAddress());
      await solution.setProposeWithdrawPollDuration(180);
      await solution.setRewardPollDuration(180);
      await token.transfer(solution.address, parseEther("1000"));

      tx = await solution.addReward(parseEther("5"), 180);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
      reward = await solution.getReward(0);
      //rewardPoll = await ethers.getContractAt("RewardPoll", reward.poll);
    });
    it("Verify reward storage", async function () {
      expect(reward.id).to.be.eq(0);
      expect(reward.withdrawAmount).to.be.eq(parseEther("0"));
      expect(reward.withdrawDuration).to.be.eq(0);
      expect(reward.state).to.be.eq(RewardState.Disabled);
    });
    it("Verify reward poll storage", async function () {
      expect(await solution.getWithdrawAmount(0)).to.be.eq(parseEther("5"));
      expect(await solution.getWithdrawDuration(0)).to.be.eq(180);
    });
    it("Verify basepoll storage", async function () {
      expect(await solution.getStartTime(0)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(0)).to.be.eq(rewardTimestamp + 180);
      expect(await solution.getYesCounter(0)).to.be.eq(0);
      expect(await solution.getNoCounter(0)).to.be.eq(0);
      expect(await solution.getTotalVoted(0)).to.be.eq(0);
    });
    it("Verify current approval state", async function () {
      expect(await solution.getCurrentApprovalState(0)).to.be.eq(false);
    });
  });
});

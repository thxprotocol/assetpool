const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  helpSign,
  deployBasics,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");

describe("Test AddReward", function () {
  let solution;

  let owner;
  let voter;
  let token;
  let reward;
  let _beforeDeployment;

  let voteTxTimestamp;

  before(
    (_beforeDeployment = async function () {
      [owner, voter] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics(ethers, owner, voter);
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

      expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(1)).to.eq(rewardTimestamp + 300);

      await solution.setRewardPollDuration(900);
      //   // does not affect current polls
      expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(1)).to.eq(rewardTimestamp + 300);

      tx = await solution.addReward(parseEther("1"), 200);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      expect(await solution.getStartTime(2)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(2)).to.eq(rewardTimestamp + 900);
    });
    it("Test pollCounter", async function () {
      const POLL_BEFORE = await solution.getPollCounter();
      await solution.addReward(parseEther("1"), 200);
      expect(await solution.getPollCounter()).to.eq(POLL_BEFORE.add(1));
    });
  });
  describe("Existing reward", async function () {
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
      reward = await solution.getReward(1);
    });
    it("Verify reward storage", async function () {
      expect(reward.id).to.be.eq(1);
      expect(reward.withdrawAmount).to.be.eq(parseEther("0"));
      expect(reward.withdrawDuration).to.be.eq(0);
      expect(reward.pollId).to.be.eq(1);
      expect(reward.state).to.be.eq(RewardState.Disabled);
    });
    it("Verify reward poll storage", async function () {
      expect(await solution.getWithdrawAmount(1)).to.be.eq(parseEther("5"));
      expect(await solution.getWithdrawDuration(1)).to.be.eq(180);
      expect(await solution.getRewardIndex(1)).to.be.eq(1);
    });
    it("Verify basepoll storage", async function () {
      expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(1)).to.be.eq(rewardTimestamp + 180);
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(0);
    });
    it("Verify current approval state", async function () {
      expect(await solution.getCurrentApprovalState(1)).to.be.eq(false);
    });
  });
  describe("Vote reward", async function () {
    beforeEach(async function () {
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
      reward = await solution.getReward(1);

      tx = await solution.votePoll(1, true);
      voteTxTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
    });
    it("Verify basepoll storage", async function () {
      expect(await solution.getYesCounter(1)).to.be.eq(1);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(1);

      const vote = await solution.getVotesByAddress(1, owner.getAddress());
      expect(vote.time).to.be.eq(voteTxTimestamp);
      expect(vote.weight).to.be.eq(1);
      expect(vote.agree).to.be.eq(true);
    });
    it("Verify current approval state", async function () {
      expect(await solution.getCurrentApprovalState(1)).to.be.eq(true);
    });
    it("Voting twice not possible", async function () {
      await expect(solution.votePoll(1, true)).to.be.revertedWith("HAS_VOTED");
    });
    it("Revoke vote", async function () {
      await solution.revokeVotePoll(1);
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(0);

      const vote = await solution.getVotesByAddress(1, owner.getAddress());
      expect(vote.time).to.be.eq(0);
      expect(vote.weight).to.be.eq(0);
      expect(vote.agree).to.be.eq(false);
    });
    it("Revoke twice", async function () {
      await solution.revokeVotePoll(1);
      await expect(solution.revokeVotePoll(1)).to.be.revertedWith(
        "HAS_NOT_VOTED"
      );
    });
    it("Revoke + vote again(st)", async function () {
      await solution.revokeVotePoll(1);
      tx = await solution.votePoll(1, false);
      voteTxTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(1);
      expect(await solution.getTotalVoted(1)).to.be.eq(1);

      const vote = await solution.getVotesByAddress(1, owner.getAddress());
      expect(vote.time).to.be.eq(voteTxTimestamp);
      expect(vote.weight).to.be.eq(1);
      expect(vote.agree).to.be.eq(false);
    });
    it("Finalizing not possible", async function () {
      // if this one fails, please check timestmap first
      await expect(solution.finalizePoll(1)).to.be.revertedWith("WRONG_STATE");
    });
  });
  describe("Finalize reward (approved)", async function () {
    beforeEach(async function () {
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

      tx = await solution.addReward(parseEther("5"), 250);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      tx = await solution.votePoll(1, true);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.finalizePoll(1);
      reward = await solution.getReward(1);
    });
    it("Verify basepoll storage", async function () {
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(0);
    });
    it("Verify reward storage", async function () {
      expect(reward.id).to.be.eq(1);
      expect(reward.withdrawAmount).to.be.eq(parseEther("5"));
      expect(reward.withdrawDuration).to.be.eq(250);
      expect(reward.pollId).to.be.eq(0);
      expect(reward.state).to.be.eq(RewardState.Enabled);
    });
  });
  describe("Finalize reward (declined)", async function () {
    beforeEach(async function () {
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

      tx = await solution.addReward(parseEther("5"), 250);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      tx = await solution.votePoll(1, false);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.finalizePoll(1);
      reward = await solution.getReward(1);
    });
    it("Verify basepoll storage", async function () {
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(0);
    });
    it("Verify reward storage", async function () {
      expect(reward.id).to.be.eq(1);
      expect(reward.withdrawAmount).to.be.eq("0");
      expect(reward.withdrawDuration).to.be.eq(0);
      expect(reward.pollId).to.be.eq(0);
      expect(reward.state).to.be.eq(RewardState.Disabled);
    });
  });
});

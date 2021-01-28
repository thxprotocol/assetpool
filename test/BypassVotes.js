const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  timestamp,
  events,
  deployBasics,
  updateToBypassPolls,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");
// TODO, should bypassvotes also skip poll time?
describe("Bypass Votes", function () {
  let solution;

  let owner;
  let voter;
  let token;
  let reward;
  let _beforeDeployment;

  let rewardTimestamp;
  let withdrawTimestamp;

  before(
    (_beforeDeployment = async function () {
      [owner, voter] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics();
    })
  );
  describe.only("Diff", async function () {
    before(async function () {
      await _beforeDeployment;
      ev = await events(
        assetPoolFactory.deployAssetPool(
          await owner.getAddress(),
          await owner.getAddress(),
          token.address
        )
      );
      diamond = ev[ev.length - 1].args.assetPool;

      solution = await ethers.getContractAt("ISolution", diamond);
      //await solution.addManager(voter.getAddress());
      // await token.transfer(solution.address, parseEther("1000"));

      await solution.setSigning(true);
      //await solution.setProposeWithdrawPollDuration(0);
      //await solution.setRewardPollDuration(0);
    });
    it("Add reward", async function () {
      rewardTimestamp = await timestamp(
        solution.addReward(parseEther("5"), 180)
      );
      rw = await solution.getReward(1);
      console.log(rw.withdrawAmount.toString());
    });
    it("Update polls", async function () {
      await updateToBypassPolls(solution);
    });
    it("Finalize reward", async function () {
      await solution.rewardPollFinalize(1);
      rw = await solution.getReward(1);
      console.log(rw.withdrawAmount.toString());
    });
  });
  describe("Reward", async function () {
    before(async function () {
      await _beforeDeployment;
      ev = await events(
        assetPoolFactory.deployAssetPool(
          await owner.getAddress(),
          await owner.getAddress(),
          token.address
        )
      );
      diamond = ev[ev.length - 1].args.assetPool;

      solution = await ethers.getContractAt("ISolution", diamond);
      await solution.addManager(voter.getAddress());
      await token.transfer(solution.address, parseEther("1000"));

      await solution.setProposeWithdrawPollDuration(0);
      await solution.setRewardPollDuration(0);
      await updateToBypassPolls(solution);
    });
    it("Add reward", async function () {
      rewardTimestamp = await timestamp(
        solution.addReward(parseEther("5"), 180)
      );
    });
    it("Reward storage", async function () {
      reward = await solution.getReward(1);
      expect(reward.id).to.be.eq(1);
      expect(reward.withdrawAmount).to.be.eq(0);
      expect(reward.withdrawDuration).to.be.eq(0);
      expect(reward.pollId).to.be.eq(1);
      expect(reward.state).to.be.eq(RewardState.Disabled);
    });
    it("Reward poll state", async function () {
      expect(await solution.getWithdrawAmount(1)).to.be.eq(parseEther("5"));
      expect(await solution.getWithdrawDuration(1)).to.be.eq(180);
      expect(await solution.getRewardIndex(1)).to.be.eq(0);

      expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getEndTime(1)).to.be.eq(rewardTimestamp);
      expect(await solution.getYesCounter(1)).to.be.eq(0);
      expect(await solution.getNoCounter(1)).to.be.eq(0);
      expect(await solution.getTotalVoted(1)).to.be.eq(0);

      expect(await solution.rewardPollApprovalState(1)).to.be.eq(true);
    });
    it("Finalize reward", async function () {
      await solution.rewardPollFinalize(1);
    });
    it("Reward storage", async function () {
      reward = await solution.getReward(1);
      expect(reward.id).to.be.eq(1);
      expect(reward.withdrawAmount).to.be.eq(parseEther("5"));
      expect(reward.withdrawDuration).to.be.eq(180);
      expect(reward.pollId).to.be.eq(0);
      expect(reward.state).to.be.eq(RewardState.Enabled);
    });
  });
  describe("Withdraw", async function () {
    before(async function () {
      await _beforeDeployment;
      ev = await events(
        assetPoolFactory.deployAssetPool(
          await owner.getAddress(),
          await owner.getAddress(),
          token.address
        )
      );
      diamond = ev[ev.length - 1].args.assetPool;

      solution = await ethers.getContractAt("ISolution", diamond);
      await solution.addManager(voter.getAddress());
      await token.transfer(solution.address, parseEther("1000"));

      await solution.setProposeWithdrawPollDuration(0);
      await solution.setRewardPollDuration(0);
      await updateToBypassPolls(solution);
      await solution.addReward(parseEther("5"), 0);
      await solution.rewardPollFinalize(1);
    });
    it("Verify state", async function () {
      expect(await token.balanceOf(await voter.getAddress())).to.be.eq(
        parseEther("0")
      );
      expect(await token.balanceOf(await solution.address)).to.be.eq(
        parseEther("1000")
      );
    });
    it("Claim reward", async function () {
      withdrawTimestamp = await timestamp(
        solution.claimRewardFor(1, await voter.getAddress())
      );
    });
    it("Withdraw poll storage", async function () {
      expect(await solution.getStartTime(2)).to.be.eq(withdrawTimestamp);
      expect(await solution.getEndTime(2)).to.be.eq(withdrawTimestamp);
      expect(await solution.getYesCounter(2)).to.be.eq(0);
      expect(await solution.getNoCounter(2)).to.be.eq(0);
      expect(await solution.getTotalVoted(2)).to.be.eq(0);

      expect(await solution.getBeneficiary(2)).to.be.eq(
        await solution.getMemberByAddress(await voter.getAddress())
      );
      expect(await solution.getAmount(2)).to.be.eq(parseEther("5"));
      expect(await solution.withdrawPollApprovalState(2)).to.be.eq(true);
    });
    it("Finalize withdraw", async function () {
      await solution.withdrawPollFinalize(2);
    });
    it("Verify state", async function () {
      expect(await token.balanceOf(await voter.getAddress())).to.be.eq(
        parseEther("5")
      );
      expect(await token.balanceOf(await solution.address)).to.be.eq(
        parseEther("995")
      );
    });
  });
});

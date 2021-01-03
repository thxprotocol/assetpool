const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  timestamp,
  events,
  deployBasics,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
  updateToBypassPolls,
  downgradeFromBypassPolls,
} = require("./utils.js");

describe.only("Happy flow", function () {
  let solution;

  let owner;
  let member;
  let token;
  let reward;
  let _beforeDeployment;

  let voteTxTimestamp;

  let claimRewardId;
  let claimRewardForId;
  let proposeWithdrawId;

  before(
    (_beforeDeployment = async function () {
      [owner, member] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics();
    })
  );
  describe("Add reward", async function () {
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
      await solution.setProposeWithdrawPollDuration(0);
      await solution.setRewardPollDuration(0);
      await token.transfer(solution.address, parseEther("1000"));
      await updateToBypassPolls(solution);
    });
    it("Add reward", async function () {
      await solution.addReward(parseEther("10"), 0);
    });
    it("Finalize reward", async function () {
      await solution.rewardPollFinalize(1);
    });
    it("Claim reward", async function () {
      const ev = await events(solution.claimReward(1));
      claimRewardId = ev[0].args.id;
      expect(claimRewardId).to.eq(2);
    });
    it("Finalize claimReward", async function () {
      const ev = await events(solution.withdrawPollFinalize(claimRewardId));
      expect(ev[ev.length - 1].args.approved).to.eq(true);
    });
    it("Add member", async function () {
      await solution.addMember(await member.getAddress());
    });
    it("Claim reward for member", async function () {
      const ev = await events(
        solution.claimRewardFor(1, await member.getAddress())
      );
      claimRewardForId = ev[0].args.id;
      expect(claimRewardForId).to.eq(3);
    });
    it("Remove member", async function () {
      await solution.removeMember(await member.getAddress());
    });
    it("Finalize claimRewardFor", async function () {
      const ev = await events(solution.withdrawPollFinalize(claimRewardForId));
      expect(ev[ev.length - 1].args.approved).to.eq(true);
    });
    it("Add member again", async function () {
      await solution.addMember(await member.getAddress());
    });
    it("ProposeWithdraw", async function () {
      const ev = await events(
        solution.proposeWithdraw(parseEther("1"), await member.getAddress())
      );
      proposeWithdrawId = ev[0].args.id;
      expect(proposeWithdrawId).to.eq(4);
    });
    it("downgradeFromBypassPolls", async function () {
      await downgradeFromBypassPolls(solution);
    });
    it("Finalize proposeWithdraw", async function () {
      const ev = await events(solution.withdrawPollFinalize(proposeWithdrawId));
      expect(ev[ev.length - 1].args.approved).to.eq(false);
    });
  });
});

const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  deployBasics,
  events,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
  timestamp,
} = require("./utils.js");

describe("Test UpdateReward", function () {
  let AssetPool;

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
  let updateReward = async (id, amount, time, pass) => {
    ev = await events(solution.updateReward(id, amount, time));

    const poll = ev[0].args.id;
    await solution.rewardPollVote(poll, pass);
    await ethers.provider.send("evm_increaseTime", [180]);
    await solution.rewardPollFinalize(poll);
    return solution.getReward(id);
  };

  beforeEach(async function () {
    [owner, voter] = await ethers.getSigners();
    const THXToken = await ethers.getContractFactory("ExampleToken");
    token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
    assetPoolFactory = await deployBasics(ethers, owner, voter);
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
    await solution.setProposeWithdrawPollDuration(180);
    await solution.setRewardPollDuration(180);
    await token.transfer(solution.address, parseEther("1000"));

    await solution.addReward(parseEther("5"), 250);
    tx = await solution.rewardPollVote(1, true);
    await ethers.provider.send("evm_increaseTime", [180]);
    await solution.rewardPollFinalize(1);
    reward = await solution.getReward(1);
  });
  it("Verify updateReward storage contract", async function () {
    expect(reward.pollId).to.be.eq(0);
    rewardTimestamp = await timestamp(
      solution.updateReward(1, parseEther("5"), 300)
    );
    reward = await solution.getReward(1);
    expect(reward.pollId).to.be.eq(2);

    expect(await solution.getWithdrawAmount(2)).to.be.eq(parseEther("5"));
    expect(await solution.getWithdrawDuration(2)).to.be.eq(300);
    expect(await solution.getRewardIndex(2)).to.be.eq(0);
    expect(await solution.getStartTime(2)).to.be.eq(rewardTimestamp);
    expect(await solution.getEndTime(2)).to.be.eq(rewardTimestamp + 180);
    expect(await solution.getYesCounter(2)).to.be.eq(0);
    expect(await solution.getNoCounter(2)).to.be.eq(0);
    expect(await solution.getTotalVoted(2)).to.be.eq(0);
    expect(await solution.rewardPollApprovalState(2)).to.be.eq(false);
  });
  it("approve", async function () {
    reward = await updateReward(1, parseEther("10"), 100, true);

    expect(reward.id).to.be.eq(1);
    expect(reward.pollId).to.be.eq(0);
    expect(reward.withdrawAmount).to.be.eq(parseEther("10"));
    expect(reward.withdrawDuration).to.be.eq(100);
    expect(reward.state).to.be.eq(RewardState.Enabled);
  });
  it("decline", async function () {
    reward = await updateReward(1, parseEther("10"), 100, false);

    expect(reward.id).to.be.eq(1);
    expect(reward.pollId).to.be.eq(0);
    expect(reward.withdrawAmount).to.be.eq(parseEther("5"));
    expect(reward.withdrawDuration).to.be.eq(250);
    expect(reward.state).to.be.eq(RewardState.Enabled);
  });
  it("Initial values", async function () {
    await expect(updateReward(1, 0, 0, false)).to.be.revertedWith(
      "NOT_ALLOWED"
    );
  });
  it("Partial initial values", async function () {
    await updateReward(1, 1, 0, false);
    await updateReward(1, 1, 1, false);
  });
  it("revert ENABLE reward", async function () {
    await expect(updateReward(1, ENABLE_REWARD, 0, false)).to.be.revertedWith(
      "ALREADY_ENABLED"
    );
  });
  it("DISABLE reward", async function () {
    reward = await updateReward(1, DISABLE_REWARD, 0, true);

    expect(reward.id).to.be.eq(1);
    expect(reward.pollId).to.be.eq(0);
    expect(reward.withdrawAmount).to.be.eq(parseEther("5"));
    expect(reward.withdrawDuration).to.be.eq(250);
    expect(reward.state).to.be.eq(RewardState.Disabled);
  });
  it("revert DISABLE reward", async function () {
    reward = await updateReward(1, DISABLE_REWARD, 0, true);
    await expect(updateReward(1, DISABLE_REWARD, 0, true)).to.be.revertedWith(
      "ALREADY_DISABLED"
    );
  });
  it("revert equal params", async function () {
    await expect(
      updateReward(1, parseEther("5"), 250, true)
    ).to.be.revertedWith("IS_EQUAL");
  });
  it("DISABLE + ENABLE reward", async function () {
    await updateReward(1, DISABLE_REWARD, 0, true);
    reward = await updateReward(1, ENABLE_REWARD, 0, true);

    expect(reward.id).to.be.eq(1);
    expect(reward.pollId).to.be.eq(0);
    expect(reward.withdrawAmount).to.be.eq(parseEther("5"));
    expect(reward.withdrawDuration).to.be.eq(250);
    expect(reward.state).to.be.eq(RewardState.Enabled);
  });
  it("Update disabled reward", async function () {
    await updateReward(1, DISABLE_REWARD, 0, true);
    reward = await updateReward(1, parseEther("50"), 120, true);

    expect(reward.id).to.be.eq(1);
    expect(reward.pollId).to.be.eq(0);
    expect(reward.withdrawAmount).to.be.eq(parseEther("50"));
    expect(reward.withdrawDuration).to.be.eq(120);
    expect(reward.state).to.be.eq(RewardState.Disabled);
  });
});

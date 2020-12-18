const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  helpSign,
  deployBasics,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");

describe("Test ClaimReward(for), storage/access", function () {
  let solution;

  let owner;
  let voter;
  let token;
  let reward;
  let _beforeDeployment;

  let withdrawTimestamp;

  before(
    // create a pool
    // create a rewardpoll
    // make sure the reward is activated in the pool
    (_beforeDeployment = async function () {
      [owner, voter] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics(ethers, owner, voter);
      tx = await assetPoolFactory.deployAssetPool(
        await owner.getAddress(),
        await owner.getAddress(),
        await owner.getAddress()
      );
      tx = await tx.wait();
      diamond = tx.events[tx.events.length - 1].args.assetPool;
      solution = await ethers.getContractAt("ISolution", diamond);
      //await solution.addManager(voter.getAddress());
      await solution.setProposeWithdrawPollDuration(180);
      await solution.setRewardPollDuration(180);
      await token.transfer(solution.address, parseEther("1000"));

      tx = await solution.addReward(parseEther("5"), 250);
      rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
        .timestamp;

      tx = await solution.rewardPollVote(1, true);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.rewardPollFinalize(1);
    })
  );
  it("Test claimReward", async function () {
    tx = await solution.claimReward(1);
    withdrawTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
      .timestamp;
    tx = await tx.wait();
    const member = tx.events[0].args.member;
    const id = tx.events[0].args.id;
    expect(member).to.be.eq(await owner.getAddress());
    expect(id).to.be.eq(2);
  });
  it("withdrawPoll storage", async function () {
    expect(await solution.getBeneficiary(2)).to.be.eq(await owner.getAddress());
    expect(await solution.getAmount(2)).to.be.eq(parseEther("5"));
  });
  it("basepoll storage", async function () {
    expect(await solution.getStartTime(2)).to.be.eq(withdrawTimestamp);
    expect(await solution.getEndTime(2)).to.be.eq(withdrawTimestamp + 250);
    expect(await solution.getYesCounter(2)).to.be.eq(0);
    expect(await solution.getNoCounter(2)).to.be.eq(0);
    expect(await solution.getTotalVoted(2)).to.be.eq(0);
  });
  it("Verify current approval state", async function () {
    expect(await solution.rewardPollApprovalState(2)).to.be.eq(false);
  });
  it("Claim reward as non member", async function () {
    await expect(solution.connect(voter).claimReward(1)).to.be.revertedWith(
      "NOT_MEMBER"
    );
  });
  it("Claim rewardFor non member", async function () {
    await expect(
      solution.connect(owner).claimRewardFor(1, await voter.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("Claim rewardFor member as non owner", async function () {
    await expect(
      solution.connect(voter).claimRewardFor(1, await owner.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("Claim non reward", async function () {
    await expect(solution.connect(owner).claimReward(2)).to.be.reverted;
  });
  it("Claim disabled reward", async function () {
    tx = await solution.updateReward(1, DISABLE_REWARD, 0);
    tx = await tx.wait();
    const pollid = tx.events[0].args.id;
    await solution.rewardPollVote(pollid, true);
    await ethers.provider.send("evm_increaseTime", [180]);
    await solution.rewardPollFinalize(pollid);

    await expect(solution.claimReward(1)).to.be.revertedWith("IS_NOT_ENABLED");
  });
});

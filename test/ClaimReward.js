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

      tx = await solution.votePoll(0, true);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.finalizePoll(0);
    })
  );
  it("Test claimReward", async function () {
    tx = await solution.claimReward(0);
    withdrawTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
      .timestamp;
    tx = await tx.wait();
    const member = tx.events[0].args.member;
    const id = tx.events[0].args.id;
    expect(member).to.be.eq(await owner.getAddress());
    expect(id).to.be.eq(1);
  });
  it("withdrawPoll storage", async function () {
    expect(await solution.getBeneficiary(1)).to.be.eq(await owner.getAddress());
    expect(await solution.getAmount(1)).to.be.eq(parseEther("5"));
  });
  it("basepoll storage", async function () {
    expect(await solution.getStartTime(1)).to.be.eq(withdrawTimestamp);
    expect(await solution.getEndTime(1)).to.be.eq(withdrawTimestamp + 250);
    expect(await solution.getYesCounter(1)).to.be.eq(0);
    expect(await solution.getNoCounter(1)).to.be.eq(0);
    expect(await solution.getTotalVoted(1)).to.be.eq(0);
  });
  it("Verify current approval state", async function () {
    expect(await solution.getCurrentApprovalState(1)).to.be.eq(false);
  });
  it("Claim reward as non member", async function () {
    await expect(solution.connect(voter).claimReward(0)).to.be.revertedWith(
      "NOT_MEMBER"
    );
  });
  it("Claim rewardFor non member", async function () {
    await expect(
      solution.connect(owner).claimRewardFor(0, await voter.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("Claim rewardFor member as non owner", async function () {
    await expect(
      solution.connect(voter).claimRewardFor(0, await owner.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("Claim non reward", async function () {
    await expect(solution.connect(owner).claimReward(1)).to.be.reverted;
  });
  // it("Claim disabled reward", async function () {
  //   tx = await solution.updateReward(0, DISABLE_REWARD, 0);
  //   tx = await tx.wait();
  //   const pollid = tx.events[0].args.id;
  //   await solution.votePoll(pollid, true);
  //   await ethers.provider.send("evm_increaseTime", [180]);
  //   await solution.finalizePoll(pollid);
  // });
});

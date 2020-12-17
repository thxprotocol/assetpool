const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  helpSign,
  deployBasics,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");

describe.only("Test UpdateReward", function () {
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
  let updateReward = async (gasStation, assetPool, args, account, pass) => {
    tx = await helpSign(gasStation, assetPool, "updateReward", args, account);
    if (tx.error !== null) {
      return {
        data: null,
        error: tx.error,
      };
    }
    reward = await assetPool.rewards(0);
    rewardPoll = await ethers.getContractAt("RewardPoll", reward.poll);
    tx = await helpSign(gasStation, rewardPoll, "vote", [pass], account);
    if (tx.error !== null) {
      return {
        data: null,
        error: tx.error,
      };
    }
    await ethers.provider.send("evm_increaseTime", [180]);
    await rewardPoll.finalize();
    return {
      data: await assetPool.rewards(0),
      error: null,
    };
  };

  beforeEach(async function () {
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

    await solution.addReward(parseEther("5"), 250);
    tx = await solution.votePoll(0, true);
    await ethers.provider.send("evm_increaseTime", [180]);
    await solution.finalizePoll(0);
    reward = await solution.getReward(0);
  });
  it("Verify updateReward storage contract", async function () {
    expect(reward.pollId).to.be.eq(0);
    tx = await solution.updateReward(0, parseEther("5"), 300);
    rewardTimestamp = (await ethers.provider.getBlock(tx.blockNumber))
      .timestamp;
    reward = await solution.getReward(0);
    expect(reward.pollId).to.be.eq(0);

    expect(await solution.getWithdrawAmount(1)).to.be.eq(parseEther("5"));
    expect(await solution.getWithdrawDuration(1)).to.be.eq(300);
    expect(await solution.getRewardIndex(1)).to.be.eq(0);
    expect(await solution.getStartTime(1)).to.be.eq(rewardTimestamp);
    expect(await solution.getEndTime(1)).to.be.eq(rewardTimestamp + 180);
    expect(await solution.getYesCounter(1)).to.be.eq(0);
    expect(await solution.getNoCounter(1)).to.be.eq(0);
    expect(await solution.getTotalVoted(1)).to.be.eq(0);
    expect(await solution.getCurrentApprovalState(1)).to.be.eq(false);
  });
});

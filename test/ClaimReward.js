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

  let voteTxTimestamp;

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
      await solution.addManager(voter.getAddress());
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
  describe("Test claimReward", async function () {
    //a
  });
});

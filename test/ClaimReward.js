const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  timestamp,
  events,
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
      assetPoolFactory = await deployBasics();
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

      rewardTimestamp = await timestamp(
        solution.addReward(parseEther("5"), 250)
      );

      tx = await solution.rewardPollVote(1, true);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.rewardPollFinalize(1);
    })
  );
  it("Test claimReward", async function () {
    ev = await events(solution.claimReward(1));
    const member = ev[0].args.member;
    const id = ev[0].args.id;
    expect(member).to.be.eq(await owner.getAddress());
    expect(id).to.be.eq(2);

    withdrawTimestamp = (await ev[0].getBlock()).timestamp;
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
    expect(await solution.withdrawPollApprovalState(2)).to.be.eq(false);
  });
  it("Claim reward as non member", async function () {
    await expect(solution.connect(voter).claimReward(1)).to.be.revertedWith(
      "NOT_SETUP"
    );
  });
  it("Claim rewardFor non member", async function () {
    await expect(
      solution.connect(owner).claimRewardFor(1, await voter.getAddress())
    ).to.be.revertedWith("NOT_SETUP");
  });
  it("Claim rewardFor member as non owner", async function () {
    await expect(
      solution.connect(voter).claimRewardFor(1, await owner.getAddress())
    ).to.be.revertedWith("NOT_SETUP");
  });
  it("Claim non reward", async function () {
    await expect(solution.connect(owner).claimReward(2)).to.be.reverted;
  });
  it("Claim disabled reward", async function () {
    ev = await events(solution.updateReward(1, DISABLE_REWARD, 0));
    const pollid = ev[0].args.id;
    await solution.rewardPollVote(pollid, true);
    await ethers.provider.send("evm_increaseTime", [180]);
    await solution.rewardPollFinalize(pollid);

    await expect(solution.claimReward(1)).to.be.revertedWith("IS_NOT_ENABLED");
  });
});

describe("Test ClaimReward(for), flow", function () {
  // only testing rewardpoll (not basepoll)
  let AssetPool;

  let gasStation;
  let owner;
  let voter;
  let token;
  let assetPool;
  let reward;
  let withdrawId;
  let _beforeDeployment;

  let withdrawPoll;
  let withdrawTimestamp;
  beforeEach(
    (_beforeDeployment = async function () {
      [owner, voter, third] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics();
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
      await solution.addMember(third.getAddress());
      await solution.setProposeWithdrawPollDuration(180);
      await solution.setRewardPollDuration(180);
      await token.transfer(solution.address, parseEther("1000"));

      await solution.addReward(parseEther("5"), 250);
      tx = await solution.rewardPollVote(1, true);
      await ethers.provider.send("evm_increaseTime", [180]);
      await solution.rewardPollFinalize(1);

      ev = await events(solution.connect(voter).claimReward(1));
      withdrawId = ev[0].args.id;
    })
  );
  it("Claim reward, no manager", async function () {
    await expect(solution.connect(third).withdrawPollVote(withdrawId, true)).to.be.revertedWith(
      "NO_MANAGER"
    );
  });
  it("Claim reward", async function () {
    solution.withdrawPollVote(withdrawId, true);
    await ethers.provider.send("evm_increaseTime", [250]);
    await solution.withdrawPollFinalize(withdrawId);
    expect(await token.balanceOf(await voter.getAddress())).to.be.eq(
      parseEther("5")
    );
    expect(await token.balanceOf(await solution.address)).to.be.eq(
      parseEther("995")
    );
  });
  it("Claim reward rejected", async function () {
    await solution.withdrawPollVote(withdrawId, false);
    await ethers.provider.send("evm_increaseTime", [250]);
    await solution.withdrawPollFinalize(withdrawId);
    expect(await token.balanceOf(await voter.getAddress())).to.be.eq(
      parseEther("0")
    );
    expect(await token.balanceOf(await solution.address)).to.be.eq(
      parseEther("1000")
    );
  });
});

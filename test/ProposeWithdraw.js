const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const {
  helpSign,
  deployBasics,
  events,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");

describe("Test proposeWithdraw, storage/access", function () {
  let solution;

  let owner;
  let voter;
  let poolMember;
  let token;
  let reward;
  let _beforeDeployment;

  let withdrawTimestamp;

  before(
    (_beforeDeployment = async function () {
      [owner, voter, poolMember] = await ethers.getSigners();
      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics(ethers, owner, voter);
      ev = await events(
        assetPoolFactory.deployAssetPool(
          await owner.getAddress(),
          await owner.getAddress(),
          await owner.getAddress()
        )
      );
      diamond = ev[ev.length - 1].args.assetPool;
      solution = await ethers.getContractAt("ISolution", diamond);
      //await solution.addManager(voter.getAddress());
      await solution.addMember(await poolMember.getAddress());
      await solution.setProposeWithdrawPollDuration(180);
      await solution.setRewardPollDuration(180);
    })
  );
  it("Test proposeWithdraw", async function () {
    const ev = await events(
      solution.proposeWithdraw(parseEther("1"), await poolMember.getAddress())
    );
    const member = ev[0].args.member;
    expect(member).to.eq(await poolMember.getAddress());

    withdrawTimestamp = (await ev[0].getBlock()).timestamp;
  });
  it("withdrawPoll storage", async function () {
    expect(await solution.getBeneficiary(1)).to.be.eq(
      await poolMember.getAddress()
    );
    expect(await solution.getAmount(1)).to.be.eq(parseEther("1"));
  });
  it("basepoll storage", async function () {
    expect(await solution.getStartTime(1)).to.be.eq(withdrawTimestamp);
    expect(await solution.getEndTime(1)).to.be.eq(withdrawTimestamp + 180);
    expect(await solution.getYesCounter(1)).to.be.eq(0);
    expect(await solution.getNoCounter(1)).to.be.eq(0);
    expect(await solution.getTotalVoted(1)).to.be.eq(0);
  });
  it("Verify current approval state", async function () {
    expect(await solution.withdrawPollApprovalState(1)).to.be.eq(false);
  });
  it("propose reward as non member", async function () {
    await expect(
      solution
        .connect(voter)
        .proposeWithdraw(parseEther("1"), await owner.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("propose rewardFor non member", async function () {
    await expect(
      solution.proposeWithdraw(parseEther("1"), await voter.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
  it("propose rewardFor member as non member", async function () {
    await expect(
      solution
        .connect(voter)
        .proposeWithdraw(parseEther("1"), await voter.getAddress())
    ).to.be.revertedWith("NOT_MEMBER");
  });
});

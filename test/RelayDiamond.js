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
  helpSign,
} = require("./utils.js");
// TODO, should bypassvotes also skip poll time?
describe("GasStation", function () {
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
      assetPoolFactory = await deployBasics(ethers, owner, voter);
    })
  );
  describe("Signing enabled/disabled", async function () {
    beforeEach(async function () {
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
      await solution.setSigning(true);
    });
    it("Signing disabled", async function () {
      await solution.setSigning(false);
      await expect(
        helpSign(solution, "setRewardPollDuration", [180], owner, 1)
      ).to.be.revertedWith("SIGNING_DISABLED");
    });
    it("Signing enabled", async function () {
      expect(await solution.getRewardPollDuration()).to.eq(0);
      await helpSign(solution, "setRewardPollDuration", [180], owner);
      expect(await solution.getRewardPollDuration()).to.eq(180);
    });
    it("Not manager", async function () {
      await expect(
        helpSign(solution, "setRewardPollDuration", [180], voter)
      ).to.be.revertedWith("NOT_MANAGER");
      expect(await solution.getGasStationAdmin()).to.eq(
        await owner.getAddress()
      );
    });
    it("Wrong nonce", async function () {
      const call = solution.interface.encodeFunctionData(
        "setRewardPollDuration",
        [180]
      );
      const hash = web3.utils.soliditySha3(call, 2);
      const sig = await owner.signMessage(ethers.utils.arrayify(hash));

      await expect(solution.call(call, 2, sig)).to.be.revertedWith(
        "INVALID_NONCE"
      );
    });
  });
  describe("Signing voting flow", async function () {
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
      await solution.addMember(await voter.getAddress())
      await solution.setSigning(true);

      await token.transfer(solution.address, parseEther("1000"));
      await solution.setRewardPollDuration(180);
    });
    it("Add reward, no access", async function () {
      await expect(
        helpSign(solution, "addReward", [parseEther("5"), 180], voter)
      ).to.be.revertedWith("NOT_OWNER");
    });
    it("Add reward", async function () {
      await helpSign(solution, "addReward", [parseEther("5"), 180], owner);
    });
    it("Vote reward", async function () {
      await helpSign(solution, "rewardPollVote", [1, true], owner);
    });
    it("Finalize reward", async function () {
      await ethers.provider.send("evm_increaseTime", [250]);
      await helpSign(solution, "rewardPollFinalize", [1], owner);
    });
    it("Claim reward", async function () {
      tx = await helpSign(
        solution,
        "claimRewardFor",
        [1, await voter.getAddress()],
        owner
      );
    });
    it("Vote withdraw", async function () {
      await helpSign(solution, "withdrawPollVote", [2, true], owner);
    });
    it("Finalize withdraw", async function () {
      await ethers.provider.send("evm_increaseTime", [250]);
      await helpSign(solution, "withdrawPollFinalize", [2], owner);
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

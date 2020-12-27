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
describe.only("Bypass Votes", function () {
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
  describe("Relay diamond", async function () {
    beforeEach(async function () {
      await _beforeDeployment;
      ev = await events(
        assetPoolFactory.deployAssetPool(
          await owner.getAddress(),
          await owner.getAddress(),
          await owner.getAddress()
        )
      );
      diamond = ev[ev.length - 1].args.assetPool;
      solution = await ethers.getContractAt("ISolution", diamond);
    });
    it("Test signing disabled", async function () {
      await solution.setSigning(false);
      await expect(
        helpSign(solution, "setRewardPollDuration", [180], owner, 1)
      ).to.be.revertedWith("SIGNING_DISABLED");
    });
    it("Test signing enabled", async function () {
      expect(await solution.getRewardPollDuration()).to.eq(0);
      await solution.setSigning(true);
      await helpSign(solution, "setRewardPollDuration", [180], owner);
      expect(await solution.getRewardPollDuration()).to.eq(180);
    });
  });
});

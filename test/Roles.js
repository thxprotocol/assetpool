const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { constants } = require("ethers");
const {
  timestamp,
  events,
  deployBasics,
  RewardState,
  ENABLE_REWARD,
  DISABLE_REWARD,
} = require("./utils.js");

// keccak256("MEMBER_ROLE")
MEMBER_ROLE =
  "0x829b824e2329e205435d941c9f13baf578548505283d29261236d8e6596d4636";
// keccak256("MANAGER_ROLE")
MANAGER_ROLE =
  "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08";
ADMIN_ROLE = constants.HashZero;

describe("Test Roles", function () {
  let solution;

  let owner;
  let ownerAddress;
  let voter;
  let token;
  let reward;
  let _beforeDeployment;

  let voteTxTimestamp;

  before(
    (_beforeDeployment = async function () {
      [owner, voter, other] = await ethers.getSigners();

      const THXToken = await ethers.getContractFactory("ExampleToken");
      token = await THXToken.deploy(owner.getAddress(), parseEther("1000000"));
      assetPoolFactory = await deployBasics();
    })
  );
  describe("Test adding roles", async function () {
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
    });
    it("default roles", async function () {
      const ownerAddress = await owner.getAddress();

      expect(await solution.getOwner()).to.eq(ownerAddress); // owner of the diamond
      expect(await solution.isManager(ownerAddress)).to.eq(true);
      expect(await solution.isMember(ownerAddress)).to.eq(true);

      expect(await solution.isMemberRoleAdmin(ownerAddress)).to.eq(true);
      expect(await solution.isManagerRoleAdmin(ownerAddress)).to.eq(true);
    });
    it("addMember", async function () {
      const voterAddress = await voter.getAddress();

      await solution.addMember(voterAddress);
      expect(await solution.isMember(voterAddress)).to.eq(true);
      expect(await solution.isManager(voterAddress)).to.eq(false);

      await expect(
        solution.connect(voter).addMember(await other.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
    });
    // Not possible as this skipped the member setup
    // it("addMember directly", async function () {
    //   const voterAddress = await voter.getAddress();

    //   await solution.grantRole(MEMBER_ROLE, voterAddress);
    //   expect(await solution.isMember(voterAddress)).to.eq(true);
    //   expect(await solution.isManager(voterAddress)).to.eq(false);

    //   await expect(
    //     solution.connect(voter).addMember(await other.getAddress())
    //   ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
    // });
    it("addManager", async function () {
      const voterAddress = await voter.getAddress();

      await solution.addManager(voterAddress);
      expect(await solution.isMember(voterAddress)).to.eq(true);
      expect(await solution.isManager(voterAddress)).to.eq(true);

      await expect(
        solution.connect(voter).addMember(await other.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
    });
    it("addManager directly", async function () {
      const voterAddress = await voter.getAddress();
      await solution.addMember(voterAddress)

      await solution.grantRole(MANAGER_ROLE, voterAddress);
      expect(await solution.isMember(voterAddress)).to.eq(true);
      expect(await solution.isManager(voterAddress)).to.eq(true);

      await expect(
        solution.connect(voter).addMember(await other.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
    });
    it("addAdmin directly", async function () {
      const voterAddress = await voter.getAddress();
      await solution.addMember(voterAddress)

      await solution.grantRole(ADMIN_ROLE, voterAddress);
      expect(await solution.isMember(voterAddress)).to.eq(true);
      expect(await solution.isManager(voterAddress)).to.eq(false);

      await solution.connect(voter).addMember(await other.getAddress());
      expect(await solution.isMemberRoleAdmin(voterAddress)).to.eq(true);
      expect(await solution.isManagerRoleAdmin(voterAddress)).to.eq(true);
    });
  });
  describe("Test revoking/renouncing roles", async function () {
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
      await solution.addMember(await voter.getAddress());
      await solution.addMember(await other.getAddress());
      await solution.grantRole(MANAGER_ROLE, await other.getAddress());
    });
    it("Revoke", async function () {
      ev = await events(
        solution.revokeRole(MEMBER_ROLE, await voter.getAddress())
      );
      expect(ev.length).to.eq(1);
      ev = await events(
        solution.revokeRole(MANAGER_ROLE, await voter.getAddress())
      );
      expect(ev.length).to.eq(0);
      ev = await events(
        solution.revokeRole(ADMIN_ROLE, await voter.getAddress())
      );
      expect(ev.length).to.eq(0);
    });
    it("Renounce", async function () {
      await expect(
        solution.renounceRole(MEMBER_ROLE, voter.getAddress())
      ).to.be.revertedWith("AccessControl: can only renounce roles for self");

      ev = await events(
        solution
          .connect(voter)
          .renounceRole(MEMBER_ROLE, await voter.getAddress())
      );
      expect(ev.length).to.eq(1);

      ev = await events(
        solution
          .connect(voter)
          .renounceRole(MANAGER_ROLE, await voter.getAddress())
      );
      expect(ev.length).to.eq(0);
    });
    it("Revoke admin", async function () {
      ev = await events(
        solution.revokeRole(ADMIN_ROLE, await owner.getAddress())
      );
      expect(ev.length).to.eq(1);

      await expect(
        solution.addMember(await voter.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
      await expect(
        solution.revokeRole(MEMBER_ROLE, await voter.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to revoke");
    });
    it("Renounce admin", async function () {
      ev = await events(
        solution.renounceRole(ADMIN_ROLE, await owner.getAddress())
      );
      expect(ev.length).to.eq(1);

      await expect(
        solution.addMember(await voter.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant");
      await expect(
        solution.revokeRole(MEMBER_ROLE, await voter.getAddress())
      ).to.be.revertedWith("AccessControl: sender must be an admin to revoke");
    });
  });
});

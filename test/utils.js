const { utils } = require("ethers/lib");
const { BigNumber } = require("ethers");

function hex2a(hex) {
  var str = "";
  for (var i = 0; i < hex.length; i += 2) {
    var v = parseInt(hex.substr(i, 2), 16);
    if (v == 8) continue; // http://www.fileformat.info/info/unicode/char/0008/index.htm
    if (v == 15) continue;
    if (v == 16) continue; // http://www.fileformat.info/info/unicode/char/0010/index.htm
    if (v == 14) continue; // https://www.fileformat.info/info/unicode/char/000e/index.htm
    if (v) str += String.fromCharCode(v);
  }
  return str.trim();
}

module.exports = {
  helpSign: async (gasStation, object, name, args, account) => {
    nonce = await gasStation.getLatestNonce(account.getAddress());
    nonce = parseInt(nonce) + 1;
    const call = object.interface.encodeFunctionData(name, args);
    const hash = web3.utils.soliditySha3(
      call,
      object.address,
      gasStation.address,
      nonce
    );
    const sig = await account.signMessage(ethers.utils.arrayify(hash));
    tx = await gasStation.call(call, object.address, nonce, sig);
    tx = await tx.wait();
    timestamp = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;

    //Result event from gasSation
    const event = await gasStation.interface.parseLog(
      tx.logs[tx.logs.length - 1]
    );
    res = event.args;
    if (res.success) {
      logs = [];
      for (const log of tx.logs) {
        let event;
        try {
          event = await object.interface.parseLog(log);
        } catch (err) {
          continue;
        }
        logs.push(event);
      }

      return {
        logs: logs,
        error: null,
        timestamp: timestamp,
      };
    } else {
      // remove initial string that indicates this is an error
      // then parse it to hex --> ascii
      error = hex2a(res.data.substr(10));
      return {
        logs: null,
        error: error,
        timestamp: timestamp,
      };
    }
  },
  deployBasics: async (ethers, owner, voter) => {
    FacetCutAction = {
      Add: 0,
      Replace: 1,
      Remove: 2,
    };
    getSelectors = function (contract) {
      const signatures = [];
      for (const key of Object.keys(contract.functions)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
      }

      return signatures;
    };
    AssetPoolFacet = await ethers.getContractFactory("AssetPoolFacet");
    AssetPoolFacetView = await ethers.getContractFactory("AssetPoolFacetView");
    RolesFacet = await ethers.getContractFactory("RolesFacet");
    DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
    OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    GasStationFacet = await ethers.getContractFactory("GasStationFacet");
    RewardPollFacet = await ethers.getContractFactory("RewardPollFacet");
    PollProxyFacet = await ethers.getContractFactory("PollProxyFacet");

    AssetPoolFactory = await ethers.getContractFactory("AssetPoolFactory");

    assetPoolFacet = await AssetPoolFacet.deploy();
    assetPoolFacetView = await AssetPoolFacetView.deploy();
    rolesFacet = await RolesFacet.deploy();
    diamondCutFacet = await DiamondCutFacet.deploy();
    diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    ownershipFacet = await OwnershipFacet.deploy();
    gasStationFacet = await GasStationFacet.deploy();
    rewardPollFacet = await RewardPollFacet.deploy();
    pollProxyFacet = await PollProxyFacet.deploy();

    diamondCut = [
      {
        action: FacetCutAction.Add,
        facetAddress: assetPoolFacet.address,
        functionSelectors: getSelectors(assetPoolFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: diamondCutFacet.address,
        functionSelectors: getSelectors(diamondCutFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: diamondLoupeFacet.address,
        functionSelectors: getSelectors(diamondLoupeFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: ownershipFacet.address,
        functionSelectors: getSelectors(ownershipFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: gasStationFacet.address,
        functionSelectors: getSelectors(gasStationFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: rewardPollFacet.address,
        functionSelectors: getSelectors(rewardPollFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: pollProxyFacet.address,
        functionSelectors: getSelectors(pollProxyFacet),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: assetPoolFacetView.address,
        functionSelectors: getSelectors(assetPoolFacetView),
      },
      {
        action: FacetCutAction.Add,
        facetAddress: rolesFacet.address,
        functionSelectors: getSelectors(rolesFacet),
      },
    ];
    return await AssetPoolFactory.deploy(diamondCut);
  },
  RewardState: {
    Disabled: 0,
    Enabled: 1,
  },
  ENABLE_REWARD: BigNumber.from("2").pow(250),
  DISABLE_REWARD: BigNumber.from("2").pow(251),
};

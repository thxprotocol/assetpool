const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { utils } = require("ethers/lib");
const { ethers } = require("hardhat");

const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2,
};

function getSelectors(contract) {
    const signatures = [];
    for(const key of Object.keys(contract.functions)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }

    return signatures;
}


describe("Happyflow", function() {
    beforeEach(async function () {
        [owner, voter] = await ethers.getSigners();
        AssetPoolFacet = await ethers.getContractFactory("AssetPoolFacet")
        DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet")
        DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet")
        OwnershipFacet = await ethers.getContractFactory("OwnershipFacet")
        GasStationFacet = await ethers.getContractFactory("GasStationFacet")
        RewardPollFacet = await ethers.getContractFactory("RewardPollFacet")
        PollProxyFacet = await ethers.getContractFactory("PollProxyFacet")

        AssetPoolFactory = await ethers.getContractFactory("AssetPoolFactory")


        assetPoolFacet = await AssetPoolFacet.deploy();
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
                functionSelectors: getSelectors(assetPoolFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: diamondCutFacet.address,
                functionSelectors: getSelectors(diamondCutFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: diamondLoupeFacet.address,
                functionSelectors: getSelectors(diamondLoupeFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: ownershipFacet.address,
                functionSelectors: getSelectors(ownershipFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: gasStationFacet.address,
                functionSelectors: getSelectors(gasStationFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: rewardPollFacet.address,
                functionSelectors: getSelectors(rewardPollFacet)
            },
            {
                action: FacetCutAction.Add,
                facetAddress: pollProxyFacet.address,
                functionSelectors: getSelectors(pollProxyFacet)
            }
        ]
        assetPoolFactory = await AssetPoolFactory.deploy(diamondCut);
        tx = await assetPoolFactory.deployAssetPool(await owner.getAddress());
        tx = await tx.wait()
        diamond = tx.events[tx.events.length - 1].args.assetPool

        solution = await ethers.getContractAt("IAssetPoolFacet", diamond);
    })

    it("test storage" , async() => {
        await solution.setMeme(1, 5);
        expect(await solution.getMeme(1)).to.be.eq(5)

        expect(await solution.getMeme(0)).to.be.eq(0)
        await solution.setMeme(0, 500);
        expect(await solution.getMeme(0)).to.be.eq(500)
        await solution.setMeme(0, 542);
        expect(await solution.getMeme(0)).to.be.eq(542)
    })

    it("Normal", async() => {
        await solution.initialize(await owner.getAddress());
        expect(await solution.getAdmin()).to.eq(await owner.getAddress());

        tx = await solution.test()
        tx = await tx.wait();
        let ev = await AssetPoolFacet.interface.parseLog(tx.logs[0])
        expect(ev.args.user).to.eq(await owner.getAddress());
    })

    it("Signed",  async() => {
        await solution.initialize(await owner.getAddress());

        nonce = await solution.getLatestNonce(voter.getAddress());
        nonce = parseInt(nonce) + 1;
        const call = solution.interface.encodeFunctionData("test", []);
        const hash = web3.utils.soliditySha3(call, nonce)
        const sig = await voter.signMessage(ethers.utils.arrayify(hash))
        tx = await solution.call(call, nonce, sig);
        tx = await tx.wait()

        ev = await AssetPoolFacet.interface.parseLog(tx.logs[0])

        expect(ev.args.user).to.eq(await voter.getAddress())

    })

    // it("Test vote proxy",  async() => {
    //     await solution.initialize(await owner.getAddress());
    //     nonce = await solution.getLatestNonce(voter.getAddress());
    //     nonce = parseInt(nonce) + 1;

    //     tx = await solution.setMemeYes(1, 555);
    //     tx = await tx.wait()

    //     const res2 = await solution.getMemeYes(1);
    //     console.error("b", res2.toString())
    // })
})
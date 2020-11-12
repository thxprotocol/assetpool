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


describe("PieFactoryContract", function() {
    it("Test",  async() => {
        [owner, voter] = await ethers.getSigners();
        Diamond = await ethers.getContractFactory("Diamond")
        TestFacet = await ethers.getContractFactory("TestFacet")
        DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet")
        DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet")
        OwnershipFacet = await ethers.getContractFactory("OwnershipFacet")
        GasStationFacet = await ethers.getContractFactory("GasStationFacet")


        testfacet = await TestFacet.deploy();
        diamondCutFacet = await DiamondCutFacet.deploy();
        diamondLoupeFacet = await DiamondLoupeFacet.deploy();
        ownershipFacet = await OwnershipFacet.deploy();
        gasStationFacet = await GasStationFacet.deploy();

        diamondCut = [
            {
                action: FacetCutAction.Add,
                facetAddress: testfacet.address,
                functionSelectors: getSelectors(testfacet)
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
            }
        ]


        diamond = await Diamond.deploy(diamondCut, await owner.getAddress());
        solution = await ethers.getContractAt("ITestFacet", diamond.address);

        expect(await solution.getAdmin()).to.eq(ethers.constants.AddressZero);
        await solution.initialize(await owner.getAddress());
        expect(await solution.getAdmin()).to.eq(await owner.getAddress());

        tx = await solution.test();
        tx = await tx.wait();
        let ev = await TestFacet.interface.parseLog(tx.logs[0])
        expect(ev.args.user).to.eq(await owner.getAddress());



        nonce = await solution.getLatestNonce(voter.getAddress());
        nonce = parseInt(nonce) + 1;
        const call = solution.interface.encodeFunctionData("test", []);
        const hash = web3.utils.soliditySha3(call, nonce)
        const sig = await voter.signMessage(ethers.utils.arrayify(hash))
        tx = await solution.call(call, nonce, sig);
        tx = await tx.wait()
        ev = await TestFacet.interface.parseLog(tx.logs[0])
        expect(ev.args.user).to.eq(await voter.getAddress())

    })
})
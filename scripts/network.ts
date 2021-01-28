const RPC = 'https://rpc-mumbai.maticvigil.com/v1/0f8c3018d8f7b5ca661d1b2b528091baae9527e2';
const PRIVATE_KEY = '0x873c254263b17925b686f971d7724267710895f1585bb0533db8e693a2af32ff';
const ASSET_POOL_FACTORY_ADDRESS = "0xB973b732820484157971C531b84BdEdA0e051BB5";

import { Contract, ContractFactory, ethers, utils } from 'ethers';

import AssetPoolFactoryArtifact from '../artifacts/contracts/factories/AssetPoolFactory.sol/AssetPoolFactory.json';
import ISolutionArtifact from '../artifacts/contracts/interfaces/ISolution.sol/ISolution.json';
import ExampleTokenArtifact from '../artifacts/contracts/ExampleToken.sol/ExampleToken.json';
import WithdrawPollFacetBypassArtifact from '../artifacts/contracts/facets/PollFacet/WithdrawPollFacetBypass.sol/WithdrawPollFacetBypass.json';
import RewardPollFacetBypassArtifact from '../artifacts/contracts/facets/PollFacet/RewardPollFacetBypass.sol/RewardPollFacetBypass.json';

export const provider = new ethers.providers.JsonRpcProvider(RPC);
export const admin = new ethers.Wallet(PRIVATE_KEY, provider);

export const assetPoolFactory = new ethers.Contract(ASSET_POOL_FACTORY_ADDRESS, AssetPoolFactoryArtifact.abi, admin);
export const solutionContract = (address?: string) => {
    return new ethers.Contract(address, ISolutionArtifact.abi, admin);
};
export const tokenContract = (address?: string) => {
    return new ethers.Contract(address, ExampleTokenArtifact.abi, admin);
};

const getSelectors = function (contract: Contract) {
    const signatures = [];
    for (const key of Object.keys(contract.functions)) {
        signatures.push(utils.keccak256(utils.toUtf8Bytes(key)).substr(0, 10));
    }

    return signatures;
};

export const updateToBypassPolls = async (solution: Contract) => {
    const withdrawPollFacetBypassFactory = new ContractFactory(
        WithdrawPollFacetBypassArtifact.abi,
        WithdrawPollFacetBypassArtifact.bytecode,
        admin,
    );
    const rewardPollFacetBypassFactory = new ContractFactory(
        RewardPollFacetBypassArtifact.abi,
        RewardPollFacetBypassArtifact.bytecode,
        admin,
    );
    const withdrawPollFacetBypass = await withdrawPollFacetBypassFactory.deploy();
    const rewardPollFacetBypass = await rewardPollFacetBypassFactory.deploy();

    await solution.updateAssetPool(getSelectors(withdrawPollFacetBypass), withdrawPollFacetBypass.address);
    await solution.updateAssetPool(getSelectors(rewardPollFacetBypass), rewardPollFacetBypass.address);
};

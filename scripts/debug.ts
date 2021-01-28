import { admin, assetPoolFactory, solutionContract, updateToBypassPolls } from './network';
import { parseEther } from 'ethers/lib/utils';

const events = async (tx: any) => {
    tx = await tx;
    tx = await tx.wait();
    return tx.events;
};

async function main() {
    const ev = await events(
        await assetPoolFactory.deployAssetPool(
            admin.address,
            admin.address,
            '0x559ee115180991AD1421C531c37484056C87Cc68', // ERC20 contract on matic
        ),
    );
    const event = ev.find((e: any) => e.event === 'AssetPoolDeployed');
    const solution = solutionContract(event.args.assetPool);
    
    // const solution = solutionContract('0xa78Bf3E22C8C70fB3c1A485bEff50A16e8a4fdbD');
    console.log('Asset Pool Address: ', solution.address)

    await solution.setSigning(true);

    await updateToBypassPolls(solution);
    console.log('Update success')

    await (await solution.addReward(parseEther('5'), 0)).wait();

    const storage = await solution.getReward(1);
    console.log('Reward Storage: ', storage);

    await (await solution.rewardPollFinalize(0)).wait();

    const reward = await solution.getReward(1);
    console.log('Reward Storage (after): ', reward);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

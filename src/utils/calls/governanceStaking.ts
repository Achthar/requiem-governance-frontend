import BigNumber from 'bignumber.js'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'


// staking functions
export const deposit = async (stakingContract, to, amount) => {

    const tx = await stakingContract.deposit(amount, to)
    const receipt = await tx.wait()
    return receipt.status
}

export const withdrawAndHarvest = async (stakingContract, to, amount) => {

    const tx = await stakingContract.withdrawAndHarvest(amount, to)
    const receipt = await tx.wait()
    return receipt.status
}


export const harvest = async (stakingContract, to) => {

    const tx = await stakingContract.harvest(to)
    const receipt = await tx.wait()
    return receipt.status
}

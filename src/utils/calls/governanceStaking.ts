import BigNumber from 'bignumber.js'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'


// staking functions
export const deposit = async (chainId, stakingContract, to, amount) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.deposit(amount, to)
    const receipt = await tx.wait()
    return receipt.status
}

export const withdrawAndHarvest = async (chainId, stakingContract, to, amount) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await stakingContract.withdrawAndHarvest( amount, to)
    const receipt = await tx.wait()
    return receipt.status
}

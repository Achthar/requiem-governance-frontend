import BigNumber from 'bignumber.js'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'

const options = {
    gasLimit: DEFAULT_GAS_LIMIT,
}

// withdraw functions
export const withdrawFromLock = async (chainId, redReqContract, lock) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await redReqContract.withdraw(lock.id, lock.amount
        // , { ...options, gasPrice }
    )
    const receipt = await tx.wait()
    return receipt.status
}

export const emergencyWithdrawFromLock = async (chainId, redReqContract, lock) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await redReqContract.emergencyWithdraw(lock.id
        // , { ...options, gasPrice }
    )
    const receipt = await tx.wait()
    return receipt.status
}

// position management and creation functions
export const createLock = async (chainId, address, value, end, redReqContract) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await redReqContract.createLock(value, end, address
        // , { ...options, gasPrice }
    )
    const receipt = await tx.wait()
    return receipt.status
}

export const increasePosition = async (chainId, address, value, redReqContract, lock) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await redReqContract.increasePosition(value, lock.id, address
        // , { ...options, gasPrice }
    )
    const receipt = await tx.wait()
    return receipt.status
}

export const increaseMaturity = async (chainId, address, amount, newEnd, redReqContract, lock) => {
    const gasPrice = getGasPrice(chainId)

    const tx = await redReqContract.increaseTimeToMaturity(amount, lock.id, newEnd
        // , { ...options, gasPrice }
    )
    const receipt = await tx.wait()
    return receipt.status
}

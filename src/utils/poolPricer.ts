import { PoolType, STABLECOINS, StablePool, TokenAmount } from '@requiemswap/sdk'
import { ABREQ, DAI, REQT } from 'config/constants/tokens'
import { PoolClass } from 'config/constants/types'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { SerializedFarm, SerializedWeightedPair } from 'state/types'
import { deserializeToken } from 'state/user/hooks/helpers'


const TENK = BigNumber.from(10000)


export const priceRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quoteIs0 = DAI[chainId].address.toLowerCase() < REQT[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${DAI[chainId].address}-${REQT[chainId].address}` : `${REQT[chainId].address}-${DAI[chainId].address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}


export const priceAssetBackedRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quoteIs0 = DAI[chainId].address.toLowerCase() < ABREQ[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${DAI[chainId].address}-${ABREQ[chainId].address}` : `${ABREQ[chainId].address}-${DAI[chainId].address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}

export { }
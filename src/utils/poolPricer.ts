import { PoolType, STABLECOINS, StablePool, Token } from '@requiemswap/sdk'
import { ABREQ, DAI, REQT, USDC } from 'config/constants/tokens'
import { PoolClass } from 'config/constants/types'
import { BigNumber } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { SerializedFarm, SerializedWeightedPair } from 'state/types'
import { deserializeToken } from 'state/user/hooks/helpers'


const TENK = BigNumber.from(10000)
const getQuote = (chainId: number): Token => {
    if (chainId === 43113) {
        return DAI[43113];
    }

    return USDC[42261];
}

export const priceRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quote = getQuote(chainId)
    const quoteIs0 = quote.address.toLowerCase() < REQT[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${quote.address}-${REQT[chainId].address}` : `${REQT[chainId].address}-${quote.address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}


export const priceAssetBackedRequiem = (chainId: number, allPairs: { [key: string]: { [weight0fee: string]: SerializedWeightedPair } }): number => {
    const quote = getQuote(chainId)
    const quoteIs0 = quote.address.toLowerCase() < ABREQ[chainId].address.toLowerCase()
    const key = quoteIs0 ? `${quote.address}-${ABREQ[chainId].address}` : `${ABREQ[chainId].address}-${quote.address}`
    if (!allPairs || !allPairs[key])
        return 0
    const relevantPairs = Object.values(allPairs[key])
    const [prices, totalVal] = quoteIs0 ? [relevantPairs.map(pair => pair.value0 * pair.price0), relevantPairs.map(pair => pair.value0).reduce((a, b) => a + b, 0)] :
        [relevantPairs.map(pair => pair.value1 * pair.price1), relevantPairs.map(pair => pair.value1).reduce((a, b) => a + b, 0)]
    return prices.reduce((a, b) => a + b, 0) / totalVal
}

export { }
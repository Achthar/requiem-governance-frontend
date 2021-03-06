// import { TokenAmount, Pair, Currency } from '@requiemswap/sdk'
// import { useMemo } from 'react'
// import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
// import IRequiemRouter02 from 'config/abi/polygon/IRequiemRouter02.json'
import { Interface } from '@ethersproject/abi'
// // import { useNetworkState } from 'state/globalNetwork/hooks'

// import { useMultipleContractSingleData } from '../state/multicall/hooks'
// import { wrappedCurrency } from '../utils/wrappedCurrency'

// const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

// const PAIR_INTERFACE_POLYGON = new Interface(IRequiemRouter02)


// export enum PairState {
//   LOADING,
//   NOT_EXISTS,
//   EXISTS,
//   INVALID,
// }

// export function usePairs(chainId:number, currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
//   // const { chainId } = useNetworkState()

//   const tokens = useMemo(
//     () =>
//       currencies.map(([currencyA, currencyB]) => [
//         wrappedCurrency(currencyA, chainId),
//         wrappedCurrency(currencyB, chainId),
//       ]),
//     [chainId, currencies],
//   )

//   const pairAddresses = useMemo(
//     () =>
//       tokens.map(([tokenA, tokenB]) => {
//         return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
//       }),
//     [tokens],
//   )

//   // const results = useMultipleContractSingleData(pairAddresses, chainId === 56 ? PAIR_INTERFACE : PAIR_INTERFACE_POLYGON, 'getReserves')

//   const results = useMultipleContractSingleData(chainId, pairAddresses, PAIR_INTERFACE, 'getReserves')

//   return useMemo(() => {
//     return results.map((result, i) => {
//       const { result: reserves, loading } = result
//       const tokenA = tokens[i][0]
//       const tokenB = tokens[i][1]

//       if (loading) return [PairState.LOADING, null]
//       if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
//       if (!reserves) return [PairState.NOT_EXISTS, null]
//       const { reserve0, reserve1 } = reserves
//       const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
//       return [
//         PairState.EXISTS,
//         new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString())),
//       ]
//     })
//   }, [results, tokens])
// }

// export function usePair(chainId:number, tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
//   return usePairs(chainId, [[tokenA, tokenB]])[0]
// }

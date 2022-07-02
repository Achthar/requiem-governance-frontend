import { configureStore } from '@reduxjs/toolkit'
import { save, load } from 'redux-localstorage-simple'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import application from './application/reducer'
import blockReducer from './block'
import assetBackedStakingReducer from './assetBackedStaking/reducer'
// import votingReducer from './voting'
import { updateVersion } from './global/actions'
import user from './user/reducer'
import transactions from './transactions/reducer'
import stablePoolsReducer from './stablePools'
import weightedPoolsReducer from './weightedPools'
import globalNetwork from './globalNetwork/reducer'

import governance from './governance/reducer'
import oracles from './oracles/reducer'
import weightedPairReducer from './weightedPairs'
import lists from './lists/reducer'
import multicall from './multicall/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  reducer: {
    globalNetwork,
    application,
    block: blockReducer,
    // voting: votingReducer,
    stablePools: stablePoolsReducer,
    weightedPools: weightedPoolsReducer,
    weightedPairs: weightedPairReducer,
    governance,
    oracles,
    assetBackedStaking: assetBackedStakingReducer,
    // Exchange
    user,
    transactions,
    multicall,
    lists,
  },
  middleware: (getDefaultMiddleware) => [...getDefaultMiddleware({ thunk: true }), save({ states: PERSISTED_KEYS })],
  preloadedState: load({ states: PERSISTED_KEYS }),
})

store.dispatch(updateVersion())

/**
 * @see https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-dispatch-type
 */
export type AppDispatch = typeof store.dispatch
export type AppState = ReturnType<typeof store.getState>
export const useAppDispatch = () => useDispatch()
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector


export default store
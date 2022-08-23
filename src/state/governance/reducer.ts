import { createReducer } from '@reduxjs/toolkit'
import { FALLBACK_CHAINID } from 'config/constants'
import { StakeData, stakingOptions } from 'config/constants/stakingOptions'
import { SerializedBigNumber } from 'state/types'
import { changeChainIdGov, typeInput, typeInputTime } from './actions'
import { fetchGovernanceData } from './fetchGovernanceData'
import { fetchGovernanceUserDetails } from './fetchGovernanceUserDetails'
import { fetchStakeData } from './fetchStakeData'
import { fetchStakeUserDetails } from './fetchStakeUserDetails'

export interface Lock {
  amount: SerializedBigNumber
  end: number
  minted: SerializedBigNumber
  id: number
}


export interface GovernanceState {
  referenceChainId: number,
  data: {
    [chainId: number]: {
      publicDataLoaded: boolean
      userDataLoaded: boolean
      stakingDataLoaded: boolean
      stakingUserDataLoaded: boolean
      balance: string
      staked: string
      locks: { [end: number]: Lock },
      supplyABREQ: string
      supplyGREQ: string
      maxtime: number
      lockedInGovernance: string
      staking: { [pid: number]: StakeData }
    }
  }
}

const initialChainId = Number(process?.env?.REACT_APP_DEFAULT_CHAIN_ID ?? FALLBACK_CHAINID)

const initialState: GovernanceState = {
  referenceChainId: initialChainId,
  data: {
    43113: {
      publicDataLoaded: false,
      userDataLoaded: false,
      stakingDataLoaded: false,
      stakingUserDataLoaded: false,
      balance: '0',
      staked: '0',
      locks: {},
      supplyABREQ: '0',
      supplyGREQ: '0',
      lockedInGovernance: '0',
      maxtime: 100,
      staking: stakingOptions(43113)
    },
    42261: {
      publicDataLoaded: false,
      userDataLoaded: false,
      stakingDataLoaded: false,
      stakingUserDataLoaded: false,
      balance: '0',
      staked: '0',
      locks: {},
      supplyABREQ: '0',
      supplyGREQ: '0',
      lockedInGovernance: '0',
      maxtime: 100,
      staking: stakingOptions(42261)
    }
  }
}

export default createReducer<GovernanceState>(initialState, (builder) =>
  builder
    .addCase(changeChainIdGov, (state, action) => {
      state.referenceChainId = action.payload.newChainId
      state.data[state.referenceChainId].publicDataLoaded = false;
      state.data[state.referenceChainId].stakingDataLoaded = false;
      state.data[state.referenceChainId].stakingUserDataLoaded = false;
      state.data[state.referenceChainId].userDataLoaded = false;
      state.data[state.referenceChainId].locks = {};
    })
    .addCase(fetchGovernanceUserDetails.pending, state => {
      // state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceUserDetails.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = { ...state.data[state.referenceChainId], userDataLoaded: true, ...action.payload }
    })
    .addCase(fetchGovernanceUserDetails.rejected, (state, { error }) => {
      state.data[state.referenceChainId].userDataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
    .addCase(fetchGovernanceData.pending, state => {
      // state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceData.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = {
        ...state.data[state.referenceChainId],
        ...action.payload,
        publicDataLoaded: true
      }
    })
    .addCase(fetchGovernanceData.rejected, (state, { error }) => {
      state.data[state.referenceChainId].userDataLoaded = true;
      console.log(error, state)
      console.error(error.message);
    })
    .addCase(fetchStakeUserDetails.pending, state => {
      // state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchStakeUserDetails.fulfilled, (state, action) => {
      const keys = Object.keys(action.payload.stakeUserData)
      for (let i = 0; i < keys.length; i++) {
        state.data[state.referenceChainId].staking[keys[i]] = {
          ...state.data[state.referenceChainId].staking[keys[i]],
          ...action.payload.stakeUserData[i]
        }
      }
      state.data[state.referenceChainId].stakingUserDataLoaded = true

    })
    .addCase(fetchStakeUserDetails.rejected, (state, { error }) => {
      // state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
    .addCase(fetchStakeData.pending, state => {
      // state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchStakeData.fulfilled, (state, action) => {
      const keys = Object.keys(action.payload)
      for (let i = 0; i < keys.length; i++) {
        state.data[state.referenceChainId].staking[i] = {
          ...state.data[state.referenceChainId].staking[i],
          ...action.payload[i]
        }
      }

      state.data[state.referenceChainId].stakingDataLoaded = true

    })
    .addCase(fetchStakeData.rejected, (state, { error }) => {
      // state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);
    })
)

import { createReducer } from '@reduxjs/toolkit'
import { SerializedBigNumber } from 'state/types'
import { typeInput, typeInputTime } from './actions'
import { fetchGovernanceData } from './fetchGovernanceData'
import { fetchGovernanceUserDetails } from './fetchGovernanceUserDetails'

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
      dataLoaded: boolean
      balance: string
      staked: string
      locks: { [end: number]: Lock },
      supplyABREQ: string
      supplyGREQ: string
      maxtime: number
    }
  }
}

const initialState: GovernanceState = {
  referenceChainId: 43113,
  data: {
    43113: {
      publicDataLoaded: false,
      dataLoaded: false,
      balance: '0',
      staked: '0',
      locks: {},
      supplyABREQ: '0',
      supplyGREQ: '0',
      maxtime: 100
    }
  }
}

export default createReducer<GovernanceState>(initialState, (builder) =>
  builder
    .addCase(fetchGovernanceUserDetails.pending, state => {
      state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceUserDetails.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = { ...state.data[state.referenceChainId], dataLoaded: true, ...action.payload }
    })
    .addCase(fetchGovernanceUserDetails.rejected, (state, { error }) => {
      state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
    .addCase(fetchGovernanceData.pending, state => {
      state.data[state.referenceChainId].dataLoaded = false;
    })
    .addCase(fetchGovernanceData.fulfilled, (state, action) => {
      state.data[state.referenceChainId] = { ...state.data[state.referenceChainId], publicDataLoaded: true, ...action.payload }
    })
    .addCase(fetchGovernanceData.rejected, (state, { error }) => {
      state.data[state.referenceChainId].dataLoaded = true;
      console.log(error, state)
      console.error(error.message);

    })
)

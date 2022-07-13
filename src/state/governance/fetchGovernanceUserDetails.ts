/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useMemo } from 'react';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import multicall from 'utils/multicall';
import redRequiemAvax from 'config/abi/avax/GovernanceRequiem.json'
import { getGovernanceRequiemAddress, getRedRequiemStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';

export interface GovernanceUserRequest {
  chainId: number
  account: string
}

export interface GovernanceLock {
  amount: SerializedBigNumber
  end: number
  minted: SerializedBigNumber
  id: number
}

export interface GovernanceUserResponse {
  locks: { [end: number]: GovernanceLock }
  balance: SerializedBigNumber
  allowance: SerializedBigNumber
  staked: SerializedBigNumber

}
export const fetchGovernanceUserDetails = createAsyncThunk(
  "bonds/fetchGovernanceUserDetails",
  async ({ chainId, account }: GovernanceUserRequest): Promise<GovernanceUserResponse> => {

    const redRequiemAddress = getGovernanceRequiemAddress(chainId)
    const redRequiemStakingAddress = getRedRequiemStakingAddress(chainId)
    // calls for general bond data
    const calls = [
      // locked data user
      {
        address: redRequiemAddress,
        name: 'getLocks',
        params: [account]
      },
      // userBalance
      {
        address: redRequiemAddress,
        name: 'balanceOf',
        params: [account]
      },
      // allowance
      {
        address: redRequiemAddress,
        name: 'allowance',
        params: [account, redRequiemStakingAddress]
      },
      // userBalance
      {
        address: redRequiemAddress,
        name: 'balanceOf',
        params: [redRequiemStakingAddress]
      },
      // indexes
      {
        address: redRequiemAddress,
        name: 'getUserIndexes',
        params: [account]
      },
    ]

    const [locks, balance, allowance, staked, indexes] =
      await multicall(chainId, redRequiemAvax, calls)


    return {
      locks: Object.assign(
        {}, ...locks._balances.map((data, index) => {
          return {
            [Number(indexes[0][index].toString())]: {
              amount: data.amount.toString(),
              end: Number(data.end.toString()),
              minted: data.minted.toString(),
              id: Number(indexes[0][index].toString())
            }
          }
        }))
      ,
      balance: balance.toString(),
      allowance: allowance.toString(),
      staked: staked.toString()
    };
  },
);
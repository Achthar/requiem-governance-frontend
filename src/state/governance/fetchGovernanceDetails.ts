/** eslint no-empty-interface: 0 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { useMemo } from 'react';
import { ethers, BigNumber, BigNumberish } from 'ethers'
import multicall from 'utils/multicall';
import redRequiemAvax from 'config/abi/avax/RedRequiem.json'
import { getRedRequiemAddress, getRedRequiemStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';

export interface GovernanceUserRequest {
  chainId: number
  account: string
}

export interface GovernanceResponse {
  lock: {
    amount: SerializedBigNumber
    end: number
  }
  balance: SerializedBigNumber
  allowance: SerializedBigNumber
  staked: SerializedBigNumber

}
export const fetchGovernanceDetails = createAsyncThunk(
  "bonds/fetchGovernanceDetails",
  async ({ chainId, account }: GovernanceUserRequest): Promise<GovernanceResponse> => {

    const redRequiemAddress = getRedRequiemAddress(chainId)
    const redRequiemStakingAddress = getRedRequiemStakingAddress(chainId)

    // cals for general bond data
    const calls = [
      // locked data user
      {
        address: redRequiemAddress,
        name: 'locked',
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
    ]

    const [locked, balance, allowance, staked] =
      await multicall(chainId, redRequiemAvax, calls)

    // // calls from pair used for pricing
    // const callsPair = [
    //   // max payout
    //   {
    //     address: redRequiemStakingAddress,
    //     name: 'getReserves'
    //   },
    //   // debt ratio
    //   {
    //     address: redRequiemStakingAddress,
    //     name: 'totalSupply',
    //   },
    //   {
    //     address: redRequiemStakingAddress,
    //     name: 'balanceOf',
    //     params: [getAddress(addresses.treasury[chainId])]
    //   },
    // ]

    // const [reserves, supply, balance] =
    //   await multicall(chainId, weightedPairABI, callsPair)

    console.log("Red req", locked, balance, allowance)

    return {
      lock: {
        amount: locked.amount.toString(),
        end: Number(locked.end.toString())
      },
      balance: balance.toString(),
      allowance: allowance.toString(),
      staked: staked.toString()
    };
  },
);
/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ethers, BigNumber } from 'ethers'
import multicall from 'utils/multicall';
import redRequiemAvax from 'config/abi/avax/GovernanceRequiem.json'
import { getGovernanceRequiemAddress, getGovernanceStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';
import { ABREQ, USDC } from 'config/constants/tokens';
import { SerializedToken } from 'config/constants/types';
import { stakingOptions } from 'config/constants/stakingOptions';

export interface StakingPublicRequest {
  chainId: number
}

export interface GovernancePublicResponse {
  [pid: number]: {
    userStaked: SerializedBigNumber
    rewardPool: SerializedBigNumber
    reward: SerializedToken
    staking: SerializedToken

  }
}
export const fetchStakeData = createAsyncThunk(
  "bonds/fetchStakeData",
  async ({ chainId }: StakingPublicRequest): Promise<GovernancePublicResponse> => {

    const requiemGovernanceTokenAddress = getGovernanceRequiemAddress(chainId)
    const stakingAddress = getGovernanceStakingAddress(chainId)
    // calls for general bond data
    const calls = [
      // balance of staking contract
      {
        address: requiemGovernanceTokenAddress,
        name: 'balanceOf',
        params: [stakingAddress]
      },
      // abREQ balance of governance contract
      {
        address: USDC[chainId].address,
        name: 'balanceOf',
        params: [stakingAddress]
      },
    ]

    const [staked, rewardPool] = await multicall(chainId, redRequiemAvax, calls)

    const tokens = stakingOptions(chainId)
console.log("SST", tokens[0])
    return {
      0: {
        userStaked: staked.toString(),
        rewardPool: rewardPool.toString(),
        staking: tokens[0].staking,
        reward: tokens[0].reward

      }
    };
  },
);
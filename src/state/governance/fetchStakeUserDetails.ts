/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import multicall from 'utils/multicall';
import stakingAbi from 'config/abi/avax/GovernanceStaking.json'
import erc20ABI from 'config/abi/erc20.json'
import { getGovernanceRequiemAddress, getGovernanceStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';

export interface StakingUserRequest {
  chainId: number
  account: string
  
}

export interface StakingUserResponse {
  stakeUserData: {
    [pid: number]: {
      rewardDebt: SerializedBigNumber
      userStaked: SerializedBigNumber
      pendingReward: SerializedBigNumber
      allowance?: SerializedBigNumber
    }
  }
}

export const fetchStakeUserDetails = createAsyncThunk(
  "bonds/fetchStakeUserDetails",
  async ({ chainId, account }: StakingUserRequest): Promise<StakingUserResponse> => {

    const governanceRequiemAddress = getGovernanceRequiemAddress(chainId)
    const governanceStakingAddress = getGovernanceStakingAddress(chainId)

    // calls for general bond data
    const calls = [
      // locked data user
      {
        address: governanceStakingAddress,
        name: 'userInfo',
        params: [account]
      },
      // userBalance
      {
        address: governanceStakingAddress,
        name: 'pendingReward',
        params: [account]
      },
      // allowance
      {
        address: governanceRequiemAddress,
        name: 'allowance',
        params: [account, governanceStakingAddress]
      }
    ]

    const [
      info,
      pendingReward,
      allowance
    ] = await multicall(chainId, [...stakingAbi, ...erc20ABI], calls)

    return {
      stakeUserData: {
        0: {
          rewardDebt: info.rewardDebt.toString(),
          userStaked: info.amount.toString(),
          pendingReward: pendingReward.toString(),
          allowance: allowance.toString()
        }
      }
    };
  },
);
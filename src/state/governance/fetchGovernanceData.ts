/** eslint no-empty-interface: 0 */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { ethers, BigNumber } from 'ethers'
import multicall from 'utils/multicall';
import redRequiemAvax from 'config/abi/avax/GovernanceRequiem.json'
import { getGovernanceRequiemAddress, getGovernanceStakingAddress } from 'utils/addressHelpers';
import { SerializedBigNumber } from 'state/types';
import { ABREQ } from 'config/constants/tokens';


const E_NINE = BigNumber.from('1000000000')
const E_EIGHTEEN = BigNumber.from('1000000000000000000')

export interface GovernancePublicRequest {
  chainId: number
}

export interface GovernanceLock {
  amount: SerializedBigNumber
  end: number
  minted: SerializedBigNumber
  multiplier: SerializedBigNumber
  id: number
}

export interface GovernancePublicResponse {
  supplyABREQ: SerializedBigNumber
  supplyGREQ: SerializedBigNumber
  maxtime: number
  lockedInGovernance: SerializedBigNumber

}
export const fetchGovernanceData = createAsyncThunk(
  "bonds/fetchGovernanceData",
  async ({ chainId }: GovernancePublicRequest): Promise<GovernancePublicResponse> => {

    const requiemGovernanceAddress = getGovernanceRequiemAddress(chainId)
    const redRequiemStakingAddress = getGovernanceStakingAddress(chainId)
    // calls for general bond data
    const calls = [
      // supply ABREQ
      {
        address: ABREQ[chainId].address,
        name: 'totalSupply',
        params: []
      },
      // supply Governacne REQ
      {
        address: requiemGovernanceAddress,
        name: 'totalSupply',
        params: []
      },
      // maxtime parameter
      {
        address: requiemGovernanceAddress,
        name: 'MAXTIME',
        params: []
      },
      // abREQ balance of governance contract
      {
        address: ABREQ[chainId].address,
        name: 'balanceOf',
        params: [requiemGovernanceAddress]
      },
    ]

    const [supplyABREQ, supplyGREQ, maxtime, locked] =
      await multicall(chainId, redRequiemAvax, calls)


    return {
      supplyABREQ: supplyABREQ.toString(),
      supplyGREQ: supplyGREQ.toString(),
      maxtime: Number(maxtime.toString()),
      lockedInGovernance: locked.toString()
    };
  },
);
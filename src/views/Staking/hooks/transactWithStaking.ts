import { useCallback } from 'react'
import { deposit, withdrawAndHarvest } from 'utils/calls'
import { useGovernanceStakingContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'
import { Lock } from 'state/governance/reducer'

export const useDeposit = () => {
  const governanceStakingContract = useGovernanceStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await deposit(chainId, governanceStakingContract, account, amount)
    },
    [chainId, governanceStakingContract, account],
  )

  return { onDeposit: func }
}


export const useWithdrawAndHarvest = () => {
  const governanceStakingContract = useGovernanceStakingContract()
  const { chainId, account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await withdrawAndHarvest(chainId, governanceStakingContract, account, amount)
    },
    [chainId, governanceStakingContract, account],
  )

  return { onWithdrawAndHarvest: func }
}


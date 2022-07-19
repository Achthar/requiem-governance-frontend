import { useCallback } from 'react'
import { deposit, harvest, withdrawAndHarvest } from 'utils/calls'
import { useGovernanceStakingContract } from 'hooks/useContract'
import { useWeb3React } from '@web3-react/core'

export const useDeposit = () => {
  const governanceStakingContract = useGovernanceStakingContract()
  const { account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await deposit(governanceStakingContract, account, amount)
    },
    [governanceStakingContract, account],
  )

  return { onDeposit: func }
}


export const useWithdrawAndHarvest = () => {
  const governanceStakingContract = useGovernanceStakingContract()
  const { account } = useWeb3React()

  const func = useCallback(
    async (amount: string) => {
      await withdrawAndHarvest(governanceStakingContract, account, amount)
    },
    [governanceStakingContract, account],
  )

  return { onWithdrawAndHarvest: func }
}

export const useHarvest = () => {
  const governanceStakingContract = useGovernanceStakingContract()
  const { account } = useWeb3React()

  const func = useCallback(
    async () => {
      await harvest(governanceStakingContract, account)
    },
    [governanceStakingContract, account],
  )

  return { onHarvest: func }
}
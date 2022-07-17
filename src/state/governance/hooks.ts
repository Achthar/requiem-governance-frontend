import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { SerializedToken } from 'config/constants/types'
import { fetchGovernanceData } from './fetchGovernanceData'
import { typeInput, typeInputTime } from './actions'
import { AppDispatch, AppState, useAppDispatch } from '../index'
import { fetchGovernanceUserDetails } from './fetchGovernanceUserDetails'
import { fetchStakeData } from './fetchStakeData'
import { fetchStakeUserDetails } from './fetchStakeUserDetails'


export function useGovernanceState(chainId: number) {
    const state = useSelector<AppState, AppState['governance']>((_state) => _state.governance)
    return state.data[chainId]
}

export function useGovernanceActionHandlers(): {
    onCurrencyInput: (typedValue: string) => void
    onTimeInput: (typedTime: string) => void
} {
    const dispatch = useDispatch<AppDispatch>()

    const onCurrencyInput = useCallback(
        (typedValue: string) => {
            dispatch(typeInput({ typedValue }))
        },
        [dispatch],
    )
    const onTimeInput = useCallback(
        (typedTime: string) => {
            dispatch(typeInputTime({ typedTime }))
        },
        [dispatch],
    )


    return {
        onCurrencyInput,
        onTimeInput
    }
}

export function useGovernanceInfo(
    chainId: number,
    account: string
    // this is input from the balances state
): {
    dataLoaded: boolean
    balance: string
    locks: {
        [id: number]: {
            amount: string
            end: number
            minted: string
            id: number
        }
    }
    staked: string
    supplyABREQ: string
    supplyGREQ: string
    lockedInGovernance: string
    maxtime: number
} {
    const { dataLoaded } = useGovernanceState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        dispatch(fetchGovernanceData({ chainId }))
        if (!dataLoaded && account) {
            dispatch(fetchGovernanceUserDetails({ chainId, account }))
        }

    }, [account, chainId, dataLoaded, slowRefresh, dispatch])

    const { balance, locks, staked, supplyABREQ, supplyGREQ, maxtime, lockedInGovernance } = useGovernanceState(chainId)

    return {
        dataLoaded,
        balance,
        locks,
        staked,
        supplyABREQ,
        supplyGREQ,
        maxtime,
        lockedInGovernance
    }
}

export function useStakingInfo(
    chainId: number,
    account: string
    // this is input from the balances state
): {
    stakingDataLoaded: boolean
    staking: {
        [id: number]: {
            reward: SerializedToken
            staking: SerializedToken
            totalStaked?: string
            rewardPool?: string
            rewardDebt?: string
            userStaked?: string
            pendingReward?: string
        }
    }
} {
    const { stakingDataLoaded } = useGovernanceState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    useEffect(() => {
        dispatch(fetchStakeData({ chainId }))
        if (!stakingDataLoaded && account) {
            dispatch(fetchStakeUserDetails({ chainId, account }))
        }

    }, [account, chainId, stakingDataLoaded, slowRefresh, dispatch])

    const { staking } = useGovernanceState(chainId)

    return {
        stakingDataLoaded,
        staking
    }

}
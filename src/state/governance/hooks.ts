import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'
import { SerializedToken } from 'config/constants/types'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { fetchGovernanceData } from './fetchGovernanceData'
import { changeChainIdGov, typeInput, typeInputTime } from './actions'
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
    userDataLoaded: boolean
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
    const { userDataLoaded } = useGovernanceState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh } = useRefresh()

    const { chainId: stateChainId } = useNetworkState()

    useEffect(() => {
        if (chainId !== stateChainId) {
            dispatch(changeChainIdGov({ newChainId: chainId }))
        }
        dispatch(fetchGovernanceData({ chainId }))
        if (account) {
            dispatch(fetchGovernanceUserDetails({ chainId, account }))
        }

    }, [account, chainId, userDataLoaded, slowRefresh, dispatch, stateChainId])

    const { balance, locks, staked, supplyABREQ, supplyGREQ, maxtime, lockedInGovernance } = useGovernanceState(chainId)

    return {
        userDataLoaded,
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
    stakingUserDataLoaded: boolean
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
    const { stakingDataLoaded, stakingUserDataLoaded } = useGovernanceState(chainId)

    const dispatch = useAppDispatch()

    const { slowRefresh, fastRefresh } = useRefresh()

    useEffect(() => {
        dispatch(fetchStakeData({ chainId }))
        if (account) {
            dispatch(fetchStakeUserDetails({ chainId, account }))
        }

    }, [account, chainId, stakingUserDataLoaded, slowRefresh, dispatch])


    const { staking } = useGovernanceState(chainId)

    return {
        stakingDataLoaded,
        stakingUserDataLoaded,
        staking
    }

}
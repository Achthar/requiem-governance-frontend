import { serializeTokens } from "./tokens"
import { SerializedToken } from "./types"

export interface StakingConfig {
    reward: SerializedToken
    staking: SerializedToken

}

export interface StakeData extends StakingConfig {
    apr?: string
    totalStaked?: string
    stakedDollarValue?: string
    allowance?: string
    rewardPerSecond?: string
}

export interface UserStakeData extends StakeData {
    rewardDebt: string
    userStaked: string
    pendingReward: string
}


export const stakingOptions = (chainId: number): { [id: number]: StakingConfig } => {

    const serializedTokens = serializeTokens(chainId)

    return {
        0: {
            reward: serializedTokens.usdc,
            staking: serializedTokens.greq
        },
        1: {
            reward: serializedTokens.abreq,
            staking: serializedTokens.abreq,
        }
    }

}
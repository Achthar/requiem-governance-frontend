import React, { useMemo, useState } from 'react'
import { BigNumber } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import styled from 'styled-components'
import { Card, Flex, Text, Skeleton, Button, Heading, Tag, Box, ChevronRightIcon, ChevronDownIcon } from '@requiemswap/uikit'
import { DeserializedFarm } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { getFullDisplayBalance, formatNumber, formatSerializedBigNumber, formatBigNumber, formatGeneralNumber } from 'utils/formatBalance'
import { fetchGovernanceUserDetails } from 'state/governance/fetchGovernanceUserDetails'
import { useAppDispatch } from 'state'
import { fetchStakeUserDetails } from 'state/governance/fetchStakeUserDetails'
import useToast from 'hooks/useToast'
import Dots from 'components/Loader/Dots'
import { SerializedToken } from 'config/constants/types'
import { Lock } from 'state/governance/reducer'
import { prettifySeconds } from 'config'
import { ApprovalState } from 'hooks/useApproveCallback'
import { TokenImage } from 'components/TokenImage'
import { deserializeToken } from 'state/user/hooks/helpers'
import { useEmergencyWithdrawFromLock, useWithdrawFromLock } from '../hooks/useWithdrawFromLock'


const Line = styled.hr`
  height: 1px;
  border:  none;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  color: white;
  width: 90%;
  size: 0.1;
`;


export enum Action {
  stake,
  withdraw
}

const StyledButton = styled(Button) <{ mB: string, width: string }>`
  background-color:none;
  color: none;
  height: 25px;
  box-shadow: none;
  border-radius: 5px;
  width: ${({ width }) => width};
  align: right;
  marginBottom: ${({ mB }) => mB};
`

const ApprovalButton = styled(Button) <{ emergency: boolean }>`
  background-color:${({ emergency }) => emergency ? 'linear-gradient(red, black)' : 'none'};
  ${({ emergency }) => emergency ? 'background-image:linear-gradient(rgba(128, 0, 0, 0.76), black);' : ''}
  color: ${({ emergency }) => emergency ? 'white' : 'none'};
  border: none;
  height: 25px;
  box-shadow: none;
  border-radius: 16px;
  width: 95%;
`


const StakeBox = styled(Box) <{ isFirst: boolean, isLast: boolean, selected: boolean }>`
  margin-top: 5px;
  align-self: baseline;
  border-radius: 2px;
  background:  rgba(170, 170, 170, 0.1);
  border: solid 2px ${({ theme, selected }) => selected ? 'rgba(126, 126, 126, 0.25)' : theme.colors.cardBorder};
  border-top-left-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-top-right-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-bottom-left-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  border-bottom-right-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  width:100%;
`

const InnerContainer = styled(Flex)`
  flex-direction: column;
  justify-content: space-around;
  padding: 24px;
`

const ImageCont = styled.div`
  width: 30px;
`

export interface FullStakeData {
  id?: number
  staking: SerializedToken
  reward: SerializedToken
  totalStaked: string
  rewardPool?: string
  rewardDebt?: string
  userStaked?: string
  pendingReward?: string
  rewardPerSecond?: string
  totalReqLockedUser?: string
}

interface StakingOptionsProps {
  isMobile: boolean
  account: string
  stakeData: FullStakeData
  onSelect: () => void
  reqPrice: number
  selected: boolean
  isFirst: boolean
  isLast: boolean
  hideSelect: boolean
  hideActionButton: boolean
}

interface StakingHeaderProps {
  token: SerializedToken
  stakeToken: SerializedToken
  refTime: number
  onSelect: () => void
  hideSelect: boolean
}


const StakingOptionHeading: React.FC<StakingHeaderProps> = ({ onSelect, refTime, hideSelect, token, stakeToken }) => {

  return (
    <>
      <Flex justifyContent="space-between">
        <Text>Pool</Text>
        {/* <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width='40%'>
          <Text mb="4px" bold mr='20px'>Payout:</Text>
          <TokenImage token={deserializeToken(token)} chainId={token.chainId} width={30} height={30} />
          <Text mb="4px" bold mr='20px' ml='30px'>Stake:</Text>
          <TokenImage token={deserializeToken(stakeToken)} chainId={token.chainId} width={30} height={30} />
        </Flex> */}
        {/* <Flex justifyContent="center">
          {isCommunityFarm ? <CommunityTag /> : <CoreTag />}
          {multiplier ? (
            <MultiplierTag variant="secondary">{multiplier}</MultiplierTag>
          ) : (
            <Skeleton ml="4px" width={42} height={28} />
          )}
        </Flex> */}
        {!hideSelect ? (<StyledButton onClick={onSelect} > Select Pool </StyledButton>) : (<Text> Selected </Text>)}
      </Flex>
    </>
  )
}

export const StakingOption: React.FC<StakingOptionsProps> = (
  {
    isMobile,
    account,
    stakeData,
    onSelect,
    reqPrice,
    selected,
    isFirst,
    isLast,
    hideSelect
  }
) => {

  const [reqValUser, totalReqVal] = useMemo(() => {
    if (!stakeData || stakeData.reward.symbol.includes('abREQ')) return [0, 0]
    if (!stakeData.reward.symbol.includes('REQ') && !stakeData.staking.symbol.includes('REQ')) return [0, 0]
    return [Math.round(Number(stakeData.totalReqLockedUser) * reqPrice), Math.round(Number(stakeData.totalStaked) * reqPrice)]
  },
    [stakeData, reqPrice]
  )

  const [apr, apy] = useMemo(() => {
    const _apr = Number(formatEther(BigNumber.from(stakeData.rewardPerSecond)
      // .mul(BigNumber.from(10).pow(18 - stakeData.reward.decimals))
    )) * 3600 * 24 * 365 / totalReqVal
    const _apy = (1 + (_apr - 1.0) * 50 / 365) ** (365 / 50) - 1
    return [Math.round((_apr - 1) * 10000) / 100, Math.round(_apy * 10000) / 100]
  },
    [stakeData.rewardPerSecond, totalReqVal,
      //  stakeData.reward.decimals
    ]
  )

  const token = stakeData.staking
  const reward = stakeData.reward
  const headerColor = 'rgba(255, 90, 90, 0.66)';

  return (
    <StakeBox isFirst={isFirst} isLast={isLast} selected={selected}>

      <InnerContainer>
        <Flex
          alignSelf='center'
          flexDirection={isMobile ? 'column' : 'row'}
          width='100%'
          justifyContent={!hideSelect ? 'space-between' : 'space-between'}
          alignItems={!hideSelect ? 'space-between' : 'space-between'}
        >
          <Flex flexDirection={hideSelect ? (isMobile ? 'row' : 'column') : 'row'} justifyContent={isMobile ? 'center' : "space-betwen"} alignItems='center'>
            <Flex flexDirection='column' width='100%' justifyContent='center' alignItems='center'>
              <Text mb="4px" bold mr='20px' color={headerColor}>Asset</Text>
              <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width={isMobile ? '100%' : '180px'}>
                <ImageCont>
                  <TokenImage token={deserializeToken(token)} chainId={token.chainId} width={35} height={35} />
                </ImageCont>
                <Flex flexDirection='column'>
                  <Text mb="2px" bold mr='10px' ml='10px'>{token.symbol}</Text>
                  {!isMobile && (<Text mr='10px' ml='10px' fontSize='10px'>{token.name}</Text>)}
                </Flex>
              </Flex>
              {isMobile && (<Text mr='10px' ml='-20px' fontSize='10px'>{token.name}</Text>)}
            </Flex>
            <Flex flexDirection='column' width='100%' justifyContent='center' alignItems='center' marginTop={hideSelect ? '10px' : ''}>
              <Text mb="4px" bold mr='20px' color={headerColor}>Payout</Text>
              <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width={isMobile ? '100%' : '180px'}>
                <ImageCont>
                  <TokenImage token={deserializeToken(reward)} chainId={reward.chainId} width={35} height={35} />
                </ImageCont>
                <Flex flexDirection='column'>
                  <Text mb="2px" bold mr='10px' ml='10px'>{reward.symbol}</Text>
                  {!isMobile && (<Text mr='10px' ml='10px' fontSize='10px'>{reward.name}</Text>)}
                </Flex>
              </Flex>
              {isMobile && (<Text mr='10px' ml='-20px' fontSize='10px'>{reward.name}</Text>)}
            </Flex>
          </Flex>
          <Flex
            flexDirection='column'
            width={hideSelect ? (isMobile ? '100%' : '80%') : (isMobile ? '100%' : '25%')}
            marginLeft='10px'
            height='100%'
            alignContent='center'
            justifyContent='center'
            marginTop={isMobile ? '15px' : ''}
          >
            <Text mb="4px" bold mr='20px' color={headerColor} textAlign='center' >Staked</Text>
            <Flex justifyContent="space-between" width='90%'>
              <Text size='5px' width='20%'>Total</Text>
              <Text width='20%'>{Number(stakeData.totalStaked).toLocaleString()}</Text>
              <Text width='20%'>${totalReqVal.toLocaleString()}</Text>
            </Flex>
            {account && (<Flex justifyContent="space-between" width='90%'>
              <Text size='5px' width='20%'>Yours</Text>
              <Text width='20%'>{Number(formatEther(stakeData?.userStaked ?? '0')).toLocaleString()}</Text>
              <Text width='20%'>${reqValUser.toLocaleString()}</Text>
            </Flex>)}
            {(hideSelect || isMobile) && (
              <Flex flexDirection='column' width={isMobile ? '60%' : '70%'} alignSelf='center' marginTop={isMobile ? '15px' : '5px'}>
                <Text mb="4px" bold mr='20px' color={headerColor} textAlign='center'>Yields</Text>
                <Flex justifyContent="space-between">
                  <Text size='5px'>APR</Text>
                  <Text >{apr?.toLocaleString()}%</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text size='5px'>APY</Text>
                  <Text >{apy?.toLocaleString()}%</Text>
                </Flex>
              </Flex>
            )}
          </Flex>
          {!hideSelect && !isMobile && (
            <Flex flexDirection='column' width={hideSelect ? '0%' : (isMobile ? '70%' : '15%')} marginLeft='10px'>
              <Text mb="4px" bold mr='20px' color={headerColor} textAlign='center'>Yields</Text>
              {/* {!hideSelect ? (<StyledButton onClick={onSelect} > Select Pool </StyledButton>) : (<Text> Selected </Text>)} */}
              <Flex justifyContent="space-between">
                <Text size='5px'>APR</Text>
                <Text >{apr.toLocaleString()}%</Text>
              </Flex>
              <Flex justifyContent="space-between">
                <Text size='5px'>APY</Text>
                <Text >{apy?.toLocaleString()}%</Text>
              </Flex>
            </Flex>
          )}
          {!hideSelect && (isMobile ? (<ChevronDownIcon onClick={onSelect} height={60} marginLeft='10px' />) : (<ChevronRightIcon onClick={onSelect} height={60} marginLeft='10px' />))}
          {/* <Flex justifyContent="space-between">
          <Text size='5px'>Minted</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.minted, 10, 18), 2)}</Text>
        </Flex> */}
        </Flex>
      </InnerContainer>


    </StakeBox >
  )
}
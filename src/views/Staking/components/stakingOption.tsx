import React, { useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { Card, Flex, Text, Skeleton, Button, Heading, Tag, Box, ChevronRightIcon } from '@requiemswap/uikit'
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
  background:  #121212;
  border: solid 2px ${({ theme, selected }) => selected ? 'white' : theme.colors.cardBorder};
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
}

interface StakingOptionsProps {
  stakeData: FullStakeData
  onSelect: () => void
  reqPrice: number
  refTime: number
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
    stakeData,
    onSelect,
    reqPrice,
    refTime,
    selected,
    isFirst,
    isLast,
    hideSelect
  }
) => {


  if (!stakeData)
    return null;

  const token = stakeData.staking
  const reward = stakeData.reward
  const headerColor = 'rgba(255, 90, 90, 0.66)';
  return (
    <StakeBox isFirst={isFirst} isLast={isLast} selected={selected}>

      <InnerContainer>
        {/* <StakingOptionHeading
          stakeToken={token}
          token={reward}
          refTime={refTime}
          onSelect={onSelect}
          hideSelect={hideSelect}
        /> */}
        <Flex
          flexDirection='row'
          width={hideSelect ? '50%' : '100%'}
          justifyContent={!hideSelect ? 'space-between' : 'space-between'}
          alignItems={!hideSelect ? 'space-between' : 'space-between'}
        >
          <Flex flexDirection={hideSelect ? 'column' : 'row'}  justifyContent="space-betwen" alignItems='center'>
            <Flex flexDirection='column' width='100%' justifyContent='center' alignItems='center'>
              <Text mb="4px" bold mr='20px' color={headerColor}>Asset</Text>
              <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width='180px'>
                <ImageCont>
                  <TokenImage token={deserializeToken(token)} chainId={token.chainId} width={35} height={35} />
                </ImageCont>
                <Text mb="4px" bold mr='10px' ml='10px'>{token.symbol}</Text>
              </Flex>
            </Flex>
            <Flex flexDirection='column' width='100%' justifyContent='center' alignItems='center'>
              <Text mb="4px" bold mr='20px' color={headerColor}>Payout</Text>
              <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width='180px'>
                <TokenImage token={deserializeToken(reward)} chainId={reward.chainId} width={35} height={35} />
                <Text mb="4px" bold mr='10px' ml='10px'>{reward.symbol}</Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex flexDirection='column' width={hideSelect ? '100%' : '25%'} marginLeft='10px' height='100%'>
            <Text mb="4px" bold mr='20px' color={headerColor}>Staked</Text>
            <Flex justifyContent="space-between">
              <Text size='5px'>Total</Text>
              <Text >{Number(stakeData.totalStaked).toLocaleString()}</Text>
            </Flex>
            <Flex justifyContent="space-between">
              <Text size='5px'>User</Text>
              <Text >{Number(stakeData.userStaked).toLocaleString()}</Text>
            </Flex>
            {hideSelect && (
              <Flex flexDirection='column' width='100%'>
                <Text mb="4px" bold mr='150px' color={headerColor}>Yields</Text>
                <Flex justifyContent="space-between">
                  <Text size='5px'>APR</Text>
                  <Text marginLeft='100px'>{Number(stakeData.totalStaked).toLocaleString()}%</Text>
                </Flex>
                <Flex justifyContent="space-between">
                  <Text size='5px'>APY</Text>
                  <Text >{Number(stakeData.userStaked).toLocaleString()}%</Text>
                </Flex>
              </Flex>
            )}
          </Flex>
          {!hideSelect && (
            <Flex flexDirection='column' width={hideSelect ? '0%' : '15%'} marginLeft='10px'>
              <Text mb="4px" bold mr='20px' color={headerColor}>Yields</Text>
              {/* {!hideSelect ? (<StyledButton onClick={onSelect} > Select Pool </StyledButton>) : (<Text> Selected </Text>)} */}
              <Flex justifyContent="space-between">
                <Text size='5px'>APR</Text>
                <Text >{Number(stakeData.totalStaked).toLocaleString()}%</Text>
              </Flex>
              <Flex justifyContent="space-between">
                <Text size='5px'>APY</Text>
                <Text >{Number(stakeData.userStaked).toLocaleString()}%</Text>
              </Flex>
            </Flex>
          )}
          {!hideSelect && (<ChevronRightIcon onClick={onSelect} height={60} marginLeft='10px' />)}
          {/* <Flex justifyContent="space-between">
          <Text size='5px'>Minted</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.minted, 10, 18), 2)}</Text>
        </Flex> */}
        </Flex>
      </InnerContainer>


    </StakeBox>
  )
}
import React, { useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { Card, Flex, Text, Skeleton, Button, Heading, Tag, Box } from '@requiemswap/uikit'
import { DeserializedFarm } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { getFullDisplayBalance, formatNumber, formatSerializedBigNumber, formatBigNumber, formatGeneralNumber } from 'utils/formatBalance'
import { fetchGovernanceUserDetails } from 'state/governance/fetchGovernanceUserDetails'
import { useAppDispatch } from 'state'
import useToast from 'hooks/useToast'
import Dots from 'components/Loader/Dots'
import { SerializedToken } from 'config/constants/types'
import { Lock } from 'state/governance/reducer'
import { prettifySeconds } from 'config'
import { ApprovalState } from 'hooks/useApproveCallback'
import { TokenImage } from 'components/TokenImage'
import { deserializeToken } from 'state/user/hooks/helpers'
import { useEmergencyWithdrawFromLock, useWithdrawFromLock } from '../hooks/useWithdrawFromLock'

export interface StakeData {
  apr: string
  reward: SerializedToken
  totalStaked: string
  stakedDollarValue: string
  lockedABREQ: string
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


const LockBox = styled(Box) <{ isFirst: boolean, isLast: boolean, selected: boolean }>`
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

interface StakingOptionsProps {
  chainId: number
  stakeToken: SerializedToken
  token: SerializedToken
  account: string
  lock: Lock
  onSelect: () => void
  reqPrice: number
  refTime: number
  selected: boolean
  isFirst: boolean
  isLast: boolean
  hideSelect: boolean
  approval: ApprovalState
  approveCallback: () => void
  hideActionButton: boolean
  toggleLock?: (set: boolean) => void
}

interface StakingHeaderProps {
  token: SerializedToken
  stakeToken: SerializedToken
  refTime: number
  lock: Lock
  onSelect: () => void
  hideSelect: boolean
}


const StakingOptionHeading: React.FC<StakingHeaderProps> = ({ onSelect, lock, refTime, hideSelect, token, stakeToken }) => {

  return (
    <>
      <Flex justifyContent="space-between">
        <Flex flexDirection='row' justifyContent="space-betwen" alignItems='center' width='40%'>
          <Text mb="4px" bold mr='20px'>Payout:</Text>
          <TokenImage token={deserializeToken(token)} chainId={token.chainId} width={30} height={30} />
          <Text mb="4px" bold mr='20px' ml='30px'>Stake:</Text>
          <TokenImage token={deserializeToken(stakeToken)} chainId={token.chainId} width={30} height={30} />
        </Flex>
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

const StakingOption: React.FC<StakingOptionsProps> = (
  {
    chainId,
    stakeToken,
    token,
    account,
    lock,
    onSelect,
    reqPrice,
    refTime,
    selected,
    isFirst,
    isLast,
    hideSelect,
    approval,
    approveCallback,
    hideActionButton: hideApproval,
    toggleLock
  }
) => {


  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)
  const dispatch = useAppDispatch()

  const { onWithdraw } = useWithdrawFromLock()
  const { onEmergencyWithdraw } = useEmergencyWithdrawFromLock()

  const handleWithdraw = async (_lock: Lock) => {
    if (_lock.end - refTime > 0) {
      await onEmergencyWithdraw(_lock)
    } else {
      await onWithdraw(_lock)
    }
    toggleLock(false)
    dispatch(fetchGovernanceUserDetails({ chainId, account }))
  }
  if (!lock)
    return null;
  return (
    <LockBox isFirst={isFirst} isLast={isLast} selected={selected}>
      <InnerContainer>
        <StakingOptionHeading
          stakeToken={stakeToken}
          token={token}
          lock={lock}
          refTime={refTime}
          onSelect={onSelect}
          hideSelect={hideSelect}
        />
        <Flex justifyContent="space-between">
          <Text size='5px'>Locked</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.amount, 10, 18), 2)}</Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Text size='5px'>Value</Text>
          <Text >${formatGeneralNumber(Number(formatSerializedBigNumber(lock.amount, 10, 18)) * reqPrice, 2)}</Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Text size='5px'>Minted</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.minted, 10, 18), 2)}</Text>
        </Flex>
      </InnerContainer>


    </LockBox>
  )
}

export default StakingOption

/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { ONE_18, Percent, TokenAmount, Token, currencyEquals } from '@requiemswap/sdk'
import { Button, Text, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal, useMatchBreakpoints, ArrowForwardIcon, RefreshIcon } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { ABREQ, GREQ, USDC } from 'config/constants/tokens'
import { useTranslation } from 'contexts/Localization'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { useGovernanceInfo, useStakingInfo } from 'state/governance/hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { ethers } from 'ethers'
import { tryParseAmount, tryParseTokenAmount } from 'utils/numberFormatter'
import Card from 'components/Card'
import { getGovernanceRequiemAddress, getGovernanceStakingAddress } from 'utils/addressHelpers'
import Row from 'components/Row'
import getChain from 'utils/getChain'
import { useGetRawWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { priceAssetBackedRequiem } from 'utils/poolPricer'
import useRefresh from 'hooks/useRefresh'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { fetchGovernanceUserDetails } from 'state/governance/fetchGovernanceUserDetails'
import { useAppDispatch } from 'state'
import { AppHeader, AppBody, AppBodyFlex, AppHeaderFlex } from 'components/App'
import { getGovernanceStakingContract } from 'utils/contractHelpers'
import { Field } from 'config/constants/types'
import useToast from 'hooks/useToast'
import { formatEther } from 'ethers/lib/utils'
import { TokenImage } from 'components/TokenImage'
import { fetchStakingUserData } from 'state/assetBackedStaking/fetchStakingUserData'
import { fetchStakingData } from 'state/assetBackedStaking/fetchStakingData'
import { fetchUserTokenData } from 'state/user/fetchUserTokenBalances'

import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
// import Select, { OptionProps } from 'components/Select/Select'
import DynamicSelect, { OptionProps } from 'components/Select/DynamicSelect'
import { getStartDate, timeConverter } from 'utils/time'
import { bn_maxer, calculateVotingPower, get_amount_and_multiplier } from './helper/calculator'
import { StakingOption, FullStakeData, Action } from './components/stakingOption'
import { useDeposit, useHarvest, useWithdrawAndHarvest } from './hooks/transactWithStaking'


import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'


import { useTransactionAdder } from '../../state/transactions/hooks'
import { getRedRequiemContract } from '../../utils'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { useGetRequiemAmount, useUserBalances } from '../../state/user/hooks'
import Page from '../Page'


const Collapsible = styled.div<{ open: boolean, isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  justify-content: center;
  text-align: left;
  width: 100%;
  height:  ${({ open }) => !open ? '0%' : '100%'};
  transform: ${({ open, isMobile }) => (isMobile ? !open ? 'translateX(0%) scaleY(0.0)' : 'translateX(-95%)  scaleY(1.0)' :
    !open ? 'translateX(0%) scaleY(0.0)' : 'translateX(-90%)  scaleY(1.0)')};
  transition: transform 300ms ease-in-out;
  position:relative;
`

const BoxLeft = styled(Box) <{ selected: boolean, isMobile: boolean }>`
  width: ${({ selected, isMobile }) => selected ? (isMobile ? '100%' : '60%') : '100%'};
  -webkit-transform-origin: top left; -webkit-transition: all 1s;
`

const BoxRight = styled(Box) <{ selected: boolean, isMobile: boolean, connected: boolean }>`
  align-content:center;
  align-items:center;
  margin-top: 3px;
  background-color: rgba(255, 0, 0, 0.08);
  border-left: solid 2px rgba(126, 126, 126, 0.25);
  border-top: solid 2px rgba(126, 126, 126, 0.25);
  border-right: solid 2px rgba(126, 126, 126, 0.25);
  border-top-left-radius:  ${({ isMobile }) => !isMobile ? '16px' : '2px'};
  border-top-right-radius: ${({ isMobile }) => !isMobile ? '16px' : '2px'};
  ${({ connected }) => !connected ? `
  border-bottom-left-radius:  16px;
  border-bottom-right-radius: 16px;
  ` : ''}
  height: 100%;
  ${({ isMobile }) => !isMobile ?
    `margin-left: 5px;
     margin-right: 20px;`: ''}
    width: ${({ selected, isMobile }) => selected ? (isMobile ? '100%' : '37%') : '0px'};
    height: ${({ selected }) => selected ? '100%' : '0px'};
    webkit-transform-origin: top ${({ isMobile }) => !isMobile ? 'right' : 'left'}; -webkit-transition: all 1s;
  
  }
`

const BoxBottom = styled(Box) <{ selected: boolean, isMobile: boolean }>`
  margin-right: 20px;
  height: ${({ selected }) => selected ? '100%' : '0px'};
  width: ${({ selected, isMobile }) => selected ? (isMobile ? '100%' : '97.5%') : '0px'};
  -webkit-transform-origin: top left; -webkit-transition: all 1s;
  ${({ isMobile, selected }) => isMobile && selected ? 'margin-bottom: 15px;' : ''}
`

const TransformText = styled(Text) <{ selected: boolean }>`
  width: ${({ selected }) => selected ? '100%' : '0px'};
  white-space:nowrap;
  -webkit-transform-origin: top right; -webkit-transition: all 2s;
`


const GeneralLockContainer = styled.div<{ isMobile: boolean }>`
  margin-top:5px;
  position:relative;
  width:100%;
  align-self: center;
  display: flex;
  height: 100%;
  flex-direction: column;
  ${({ isMobile }) => isMobile ? `
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
  }` : `max-height: 85%;
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
    max-height: 1000px;
  }` }
`

const DropdownContainer = styled.div`
  margin-left:4px
  width: 20%;
  height: 24px;
  zoom: 0.66;
  -moz-transform: scale(0.66);
`

const ShareBox = styled(Flex) <{ isMobile: boolean }>`
  margin-left: 4px;
  margin-right: 4px;
  align-items: center;
  justify-content: center;
  width:  ${({ isMobile }) => isMobile ? '100%' : '120px'};
  flex-direction:row;
`

const CardBottom = styled(Card)`
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  background-color: rgba(255, 0, 0, 0.08);
  border-left: solid 2px rgba(126, 126, 126, 0.25);
  border-bottom: solid 2px rgba(126, 126, 126, 0.25);
  border-right: solid 2px rgba(126, 126, 126, 0.25);
  width: 100%;
`

const ActionButton = styled(Button)`
  border-radius: 16px;
  align-sel:center;
`

export default function Staking({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) {

  const { chainId: chainIdWeb3, library, account } = useActiveWeb3React()
  useChainIdHandling(chainIdWeb3, account)
  const { chainId } = useNetworkState()


  const dispatch = useAppDispatch()


  useEffect(() => {
    const _chain = getChain(chainId ?? 43113)
    if (chain !== _chain) {
      history.push(`/${_chain}/governance`)
    }

  },
    [chain, chainId, history],
  )

  const { isMobile } = useMatchBreakpoints()

  const { balance: redReqBal, staked, locks, userDataLoaded, supplyABREQ, supplyGREQ, lockedInGovernance
  } = useGovernanceInfo(chainId, account)

  const totalReqLockedUser = useMemo(() => {
    const lockKeys = Object.keys(locks)
    let totalReqLocked = BigNumber.from(0);
    if (!userDataLoaded) return '0'
    for (let i = 0; i < lockKeys.length; i++) {
      totalReqLocked = totalReqLocked.add(locks[lockKeys[i]].amount)
    }

    return formatEther(totalReqLocked)
  },
    [locks, userDataLoaded]
  )


  const {
    staking,
    stakingDataLoaded
  } = useStakingInfo(chainId, account)



  interface DataWithId extends FullStakeData {
    id?: number
    pendingRewardUsd?: number
  }

  const stakeData: DataWithId[] = useMemo(() => {
    if (!stakingDataLoaded) return []
    return Object.keys(staking).map(key => {
      return {
        id: Number(key),
        staking: staking[key]?.staking,
        reward: staking[key]?.reward,
        totalStaked: formatEther(staking[key]?.totalStaked ?? '0'),
        rewardPool: formatEther(staking[key]?.rewardPool ?? '0'),
        rewardDebt: formatEther(staking[key]?.rewardDebt ?? '0'),
        userStaked: staking[key]?.userStaked ?? '0',
        pendingReward: formatEther(staking[key]?.pendingReward ?? '0'),
        rewardPerSecond: staking[key]?.rewardPerSecond ?? '0',
        totalReqLockedUser,
        pendingRewardUsd: Number(formatEther(BigNumber.from(staking[key]?.pendingReward ?? '0').mul(BigNumber.from(10).pow(18 - staking[key]?.reward.decimals))))
      }
    })
  }, [staking, stakingDataLoaded, totalReqLockedUser])

  // useEffect(() => { console.log("STAKE", stakeData) }, [stakeData])

  const now = Math.round((new Date()).getTime() / 1000);

  // start time for slider - standardized to gmt midnight of next day
  const startTime = useMemo(() => { return getStartDate() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])


  // sets boolean for selected lock
  const [lockSelected, toggleLock] = useState(false)

  // sets selected lock end of existing user locks
  const [toggledPoolId, togglePid] = useState(9999)

  // const [tokenA, tokenB] = [useCurrency(chainId, currencyIdA) ?? undefined, useCurrency(chainId, currencyIdB) ?? undefined]
  const [tokenA, tokenB] = useMemo(
    () => {
      if (toggledPoolId === 9999)
        return [GREQ[chainId], USDC[chainId]]

      return [deserializeToken(stakeData[toggledPoolId].staking), deserializeToken(stakeData[toggledPoolId].reward)]
    }
    ,
    [chainId, toggledPoolId, stakeData],
  )



  // define which action to take
  const [action, setAction] = useState(Action.stake)

  enum InputType {
    absolute,
    percent,
    dropdown
  }
  const [inputType, setInputType] = useState(InputType.absolute)

  // value for currency input panel
  const [inputValue, onCurrencyInput] = useState('0')
  // value for slider
  const [inputPercent, onPercentageInput] = useState(0)

  const { slowRefresh } = useRefresh()



  const {
    pairs,
    metaDataLoaded,
    reservesAndWeightsLoaded,
  } = useGetRawWeightedPairsState(chainId, account, [], slowRefresh)

  const reqPrice = useMemo(
    () => {
      return priceAssetBackedRequiem(chainId, pairs)
    },
    [pairs, chainId]
  )

  const currentStakeData = useMemo(() => stakeData[toggledPoolId === 9999 ? 0 : toggledPoolId], [toggledPoolId, stakeData])

  const { balances } = useUserBalances(chainId)

  const [parsedAmounts, manualPerc] = useMemo(() => {
    setInputType(InputType.absolute)

    const value = tryParseTokenAmount(inputValue, tokenA)
    const _balance = balances[currentStakeData?.staking?.address]?.balance
    const maxAmount = action === Action.stake ? (_balance === '0' ? '1' : _balance) : currentStakeData?.userStaked
    const percentage = account ? value ? Math.round(Number(formatEther(value.raw.mul('1000000000000000000').div(maxAmount ?? 1) ?? 1)) * 100) : 0 : 0
    return [{
      [Field.CURRENCY_A]: tryParseTokenAmount(inputValue, tokenA),
      [Field.CURRENCY_B]: tryParseTokenAmount(inputValue, tokenB)
    },
    account && Math.min(percentage, 100)
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, action, supplyABREQ, supplyGREQ, account, currentStakeData])



  const parsedAmountsPercentage = useMemo(() => {
    setInputType(InputType.percent)
    if (!balances || !balances[tokenA.address]?.balance || !balances[tokenB.address]?.balance)
      return {
        [Field.CURRENCY_A]: new TokenAmount(tokenA, '0'),
        [Field.CURRENCY_B]: new TokenAmount(tokenB, '0')
      }
    let inputA: BigNumber
    let inputB: BigNumber
    if (action === Action.stake) {
      inputA = BigNumber.from(inputPercent).mul(balances[tokenA.address].balance).div(100)
      inputB = BigNumber.from(inputPercent).mul(balances[tokenB.address].balance).div(100)
    } else {
      inputA = BigNumber.from(inputPercent).mul(currentStakeData.userStaked).div(100)
      inputB = BigNumber.from(inputPercent).mul(currentStakeData.userStaked).div(100)
    }
    return {
      [Field.CURRENCY_A]: new TokenAmount(tokenA, inputA),
      [Field.CURRENCY_B]: new TokenAmount(tokenB, inputB)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputPercent, action, supplyABREQ, supplyGREQ, balances, currentStakeData])

  const finalAmount = useMemo(() => {
    return inputType === InputType.absolute ? parsedAmounts[Field.CURRENCY_A] : parsedAmountsPercentage[Field.CURRENCY_A]
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputType, parsedAmounts, parsedAmountsPercentage]
  )

  const currentShare = useMemo(() => {
    if (!currentStakeData) return 0;
    const stakedTotal = Number(currentStakeData.totalStaked)
    const userStaked = Number(formatEther(currentStakeData.userStaked))
    return Math.round(userStaked / stakedTotal * 10000) / 100
  }, [currentStakeData])



  const newShare = useMemo(() => {
    if (!finalAmount || !currentStakeData) return currentShare
    const _staked = currentStakeData?.userStaked
    const inp = Number(finalAmount.toSignificant(18))
    const amountNew = action === Action.stake ? Number(new TokenAmount(tokenA, finalAmount.raw.add(_staked ?? '0')).toSignificant(18))
      : Number(Number(formatEther(_staked)) - inp)

    return Math.round(Math.abs(amountNew) / Math.max((Number(currentStakeData.totalStaked) + (action === Action.stake ? inp : -inp)), 1) * 10000) / 100
  },
    [currentStakeData, tokenA, action, finalAmount, currentShare]
  )

  const { onDeposit } = useDeposit()
  const { onWithdrawAndHarvest } = useWithdrawAndHarvest()
  const { onHarvest } = useHarvest()


  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, account, new TokenAmount(tokenA, ethers.constants.MaxUint256), getGovernanceStakingAddress(chainId))

  const [approvalRreq, approveCallbackRreq] = useApproveCallback(
    chainId, account,
    new TokenAmount(GREQ[chainId], bn_maxer(Object.values(locks).map(l => l.minted)).toString()),
    getGovernanceStakingAddress(chainId)
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  // tx sending
  const addTransaction = useTransactionAdder()


  const [buttonText, titleText] = useMemo(() => {
    return action === Action.stake ? [`Stake ${currentStakeData?.staking?.symbol}`, 'Staked!'] : [`Withdraw ${currentStakeData?.staking?.symbol}`, 'Withdrawl complete!']
  },
    [action, currentStakeData]
  )

  const dropdownOptions = useMemo(() => {
    return [25, 50, 75, 100].map((y) => { return { label: `${String(y)}%`, value: y } })
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // function to create a lock or deposit on existing lock
  const transactWithStaking = async () => {
    if (!chainId || !library || !account) return

    // // we have to differentiate between astaking and withdrawls
    if (action === Action.stake) {
      await onDeposit(finalAmount.toBigNumber().toHexString())

    } else if (action === Action.withdraw) {
      await onWithdrawAndHarvest(finalAmount.toBigNumber().toHexString())
    }

    dispatch(fetchStakingData({ chainId }))
    dispatch(fetchStakingUserData({ chainId, account }))
    dispatch(fetchUserTokenData({ chainId, account, additionalTokens: [] }))
  }

  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  const summaryText = useMemo(() => action === Action.stake ? `Stake ${finalAmount?.toSignificant(3)} ${finalAmount?.token?.symbol}` : `Withdraw ${finalAmount?.toSignificant(3)} ${finalAmount?.token?.symbol}}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, finalAmount]
  )

  // the final transaction function
  const transactionFunc = async () => {
    setPendingTx(true)
    try {
      await transactWithStaking()
      toastSuccess(titleText, summaryText)
      // onDismiss()
    } catch (e) {
      toastError(
        'Error',
        'Please try again. Confirm the transaction and make sure you are paying enough gas!',
      )
      console.error(e)
    } finally {
      setPendingTx(false)
      // reset inputs
      onCurrencyInput('0')
      onPercentageInput(0)

      // fetch new data
      dispatch(fetchStakingData({ chainId }))
      dispatch(fetchUserTokenData({ chainId, account, additionalTokens: [] }))
      dispatch(fetchStakingUserData({ chainId, account }))
    }
  }


  // the final transaction function
  const harvestTransactionFunc = async () => {
    // setPendingTx(true)
    try {
      await onHarvest()
      toastSuccess('Rewards paid out', `Your ${currentStakeData?.reward?.symbol} rewards have been sent to your wallet.`)
      // onDismiss()
    } catch (e) {
      // toastError(
      //   'Error',
      //   'Please try again. Confirm the transaction and make sure you are paying enough gas!',
      // )
      console.error(e)
    } finally {
      // setPendingTx(false)
      dispatch(fetchUserTokenData({ chainId, account, additionalTokens: [] }))
      dispatch(fetchStakingUserData({ chainId, account }))
    }
  }


  const otherValue = useMemo(() => {
    return inputType === InputType.absolute ? (manualPerc ? `${String(manualPerc)}%` : '-') : inputType === InputType.percent ? `${String(inputPercent)}%` : ''
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputType, manualPerc, inputPercent]
  )

  const bottomBox = (_stakeData: DataWithId): JSX.Element => {
    const actionButtonColor = action === Action.stake ? 'rgba(99, 0, 0, 0.33)' : 'rgba(0, 245, 16, 0.19)'
    return (
      <CardBottom>
        <Flex flexDirection={isMobile ? 'column' : 'row'} alignItems='space-between' justifyContent='space-between' width='100%' >

          <Flex width={isMobile ? '100%' : '50%'} height='50px' marginTop='3px' flexDirection='row'>
            <Button
              variant="secondary"
              width="70%"
              mb="8px"
              style={{ borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px', backgroundColor: 'rgba(0, 0, 0, 0.5)', border: 'solid 2px rgba(126, 126, 126, 0.25)' }}
            >
              <Flex flexDirection='column'>
                <Text bold marginLeft='-5px' fontSize='12px'>Your Accrued Payout</Text>
                <Flex flexDirection='row'>
                  <Text marginRight='4px'>{_stakeData.pendingRewardUsd}</Text>
                  <TokenImage token={deserializeToken(_stakeData.reward)} chainId={chainId} width={20} height={20} />
                </Flex>
              </Flex>
            </Button>

            <Button
              onClick={harvestTransactionFunc}
              variant="primary"
              width="30%"
              mb="8px"
              style={{ borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px' }}
            >
              Claim
            </Button>
          </Flex>
          <Button
            variant="secondary"
            width={isMobile ? '100%' : "25%"}
            mb="8px"
            style={{ marginLeft: '3px', marginRight: '3px', marginBottom: '5px', backgroundColor: 'rgba(0, 0, 0, 0.5)', border: 'solid 2px rgba(126, 126, 126, 0.25)' }}
          >
            <Flex flexDirection={isMobile ? 'row' : 'column'} justifyContent='center'>

              <Text textAlign={isMobile ? 'left' : 'center'} bold marginLeft='-5px' fontSize={isMobile ? '15px' : '12px'} minWidth='150px' >Your Pool Share</Text>

              <ShareBox isMobile={isMobile}>
                {finalAmount?.raw.gt(0) ? (
                  <>
                    <Text> {currentShare}%</Text>
                    <ArrowForwardIcon />
                    <Text color={action === Action.stake ? 'green' : 'red'}> {newShare}%</Text>
                  </>
                ) : (<Text> {currentShare}%</Text>)}
              </ShareBox>
            </Flex>
          </Button>
          <ActionButton
            variant='primary'
            onClick={() => { return setAction(Action.withdraw === action ? Action.stake : Action.withdraw) }} // {onAttemptToApprove}
            width={isMobile ? '70%' : "150px"}
            mr="0.5rem"
            style={{ alignSelf: 'center', marginBottom: '5px', backgroundColor: actionButtonColor, color: 'rgba(101, 101, 101, 0.8)' }}
          >
            <RefreshIcon color='rgba(101, 101, 101, 0.7)' marginRight='5px' />
            {action === Action.withdraw ? 'Deposit instead' : 'Withdraw instead'}
          </ActionButton>
        </Flex >
      </CardBottom >)
  }


  const dropdown = (): JSX.Element => {
    return (
      <DropdownContainer onClick={() => { setInputType(InputType.dropdown) }}>
        <DynamicSelect options={dropdownOptions}
          otherValue={otherValue ?? '-'}
          otherActive={!(inputType === InputType.dropdown)}
          onChange={({ label, value }: OptionProps) => {
            setInputType(InputType.dropdown)
            return onPercentageInput(value)
          }} />
      </DropdownContainer>
    )
  }

  const pendingText = action === Action.stake ? 'Staking' : 'Withdrawing'

  const inputPanel = (text, balanceText, _tokenStaked: TokenAmount): JSX.Element => {

    const atMaxAmount = parsedAmounts[Field.CURRENCY_A]?.equalTo(new Percent('1'))

    const _token = _tokenStaked.token
    return (
      <Flex flexDirection='column' marginLeft='3px' marginRight='3px' marginTop='3px'>
        <Box my="2px" >
          <CurrencyInputPanelExpanded
            width='100%'
            balanceText={balanceText}
            balances={action === Action.stake ? { [_token.address]: new TokenAmount(_token, balances?.[_token.address]?.balance ?? '0') } :
              { [_token.address]: _tokenStaked }}
            isLoading={isLoading}
            chainId={chainId}
            account={account}
            value={inputType === InputType.absolute ? inputValue : parsedAmountsPercentage[Field.CURRENCY_A]?.toSignificant(18)}
            onUserInput={val => {
              setInputType(InputType.absolute)
              return onCurrencyInput(val)
            }}
            onMax={() => onCurrencyInput(
              formatEther(action === Action.stake ? balances?.[_token.address]?.balance : _tokenStaked.raw.toString())
            )}
            showMaxButton={!atMaxAmount}
            currency={_token}
            label={text}
            // hideInput={action === Action.stake}
            // reducedLine={action === Action.stake}
            onCurrencySelect={() => { return null }}
            disableCurrencySelect
            id="input to stake"
          />
          <Flex flexDirection='row' marginTop='3px'>
            <Slider
              name="maturity-selector"
              min={0}
              max={100}
              step={1}
              disabled={!account}
              value={inputType === InputType.percent ? inputPercent : manualPerc}
              onValueChanged={(val) => {
                setInputType(InputType.percent)
                return onPercentageInput(val)
              }}
              width={isMobile ? '90%' : '80%'}
            />
            {dropdown()}
          </Flex>
        </Box>
        <Flex flexDirection='row'>
          {!account ? (
            <ConnectWalletButton align='center' height='35px' width='100%' />
          ) : (
            <RowBetween>
              <Button
                variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                onClick={approveCallback} // {onAttemptToApprove}
                disabled={approval !== ApprovalState.NOT_APPROVED}
                width="100%"
                mr="0.5rem"
              >
                {approval === ApprovalState.PENDING ? (
                  <Dots>Enabling</Dots>
                ) : approval === ApprovalState.LOADING || approval === ApprovalState.UNKNOWN ? (
                  <Dots>Loading Allowance</Dots>
                ) : approval === ApprovalState.APPROVED ? (
                  'Enabled'
                ) : (
                  'Enable'
                )}
              </Button>
              <Button
                variant={
                  (!!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]) || (action === Action.stake)
                    ? 'primary'
                    : 'danger'
                }
                onClick={() => {
                  transactionFunc()
                }}
                width="100%"
                disabled={(approval !== ApprovalState.APPROVED) || pendingTx}
              >
                {!pendingTx ? buttonText : (
                  <Dots>
                    {pendingText}
                  </Dots>
                )}
              </Button>
            </RowBetween>
          )}
        </Flex>

      </Flex>
    )

  }

  const renderStakeData = (): JSX.Element => {
    // const props = approvalRreq !== ApprovalState.APPROVED && account ? { borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px', width: '60%' } : {}
    // used for layout of lock cards
    const indexMax = Object.values(Object.values(stakeData)).length - 1

    return (
      <Flex flexDirection='column' marginLeft={isMobile ? '0' : '20px'} maxHeight='1550px' minWidth='400px'>
        <GeneralLockContainer isMobile={isMobile}>
          {
            Object.values(stakeData).map((data, index) => {

              return (
                <Flex flexDirection='column'>
                  <Flex flexDirection={isMobile ? 'column' : 'row'} width='100%' >
                    <BoxLeft selected={data.id === toggledPoolId} isMobile={isMobile}>
                      <StakingOption
                        isMobile={isMobile}
                        account={account}
                        stakeData={data}
                        onSelect={() => {
                          setAction(Action.stake)
                          toggleLock(true)
                          togglePid(data.id)
                        }}
                        reqPrice={reqPrice}
                        isFirst={index === 0}
                        isLast={indexMax === index}
                        selected={data.id === toggledPoolId}
                        hideSelect={data.id === toggledPoolId}
                        hideActionButton={false}
                      />
                    </BoxLeft>

                    <BoxRight selected={data.id === toggledPoolId} isMobile={isMobile} connected={Boolean(account)}>
                      {data.id === toggledPoolId && inputPanel(
                        <TransformText selected={action === Action.stake}>
                          {action === Action.stake ? `Select amount to Stake` : 'Select Amount to Withdraw'}
                        </TransformText>,
                        action === Action.stake ? 'Balance' : 'Staked',
                        new TokenAmount(deserializeToken(data.staking), data?.userStaked ?? '0')
                      )
                      }
                    </BoxRight>
                  </Flex>
                  <BoxBottom selected={data.id === toggledPoolId} isMobile={isMobile}>
                    {data.id === toggledPoolId && account && bottomBox(data)}
                  </BoxBottom>
                </Flex>
              )
            })
          }
        </GeneralLockContainer >

      </Flex >
    )
  }

  return (
    <Page>
      <AppBodyFlex isMobile={isMobile}>
        <AppHeaderFlex
          chainId={chainId}
          account={account}
          title='Governance Staking'
          subtitle='Stake Governance Requiem to earn a profit share from the Requiem Protocol.'
          noConfig
        />
        {renderStakeData()}

      </AppBodyFlex>
    </Page >
  )
}

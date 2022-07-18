/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { ONE_18, Percent, TokenAmount } from '@requiemswap/sdk'
import { Button, Text, ArrowDownIcon, CardBody, Slider, Box, Flex, useModal, useMatchBreakpoints } from '@requiemswap/uikit'
import { RouteComponentProps } from 'react-router'
import { BigNumber } from '@ethersproject/bignumber'
import { ABREQ, GREQ, USDC } from 'config/constants/tokens'
import { useTranslation } from 'contexts/Localization'
import CurrencyInputPanelExpanded from 'components/CurrencyInputPanel/CurrencyInputPanelExpanded'
import { useGovernanceInfo, useStakingInfo } from 'state/governance/hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useNetworkState } from 'state/globalNetwork/hooks'
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

// import Select, { OptionProps } from 'components/Select/Select'
import DynamicSelect, { OptionProps } from 'components/Select/DynamicSelect'
import { getStartDate, timeConverter } from 'utils/time'
import { bn_maxer, calculateVotingPower, get_amount_and_multiplier } from './helper/calculator'
import { StakingOption, FullStakeData, Action } from './components/stakingOption'
import { useDeposit, useWithdrawAndHarvest } from './hooks/transactWithStaking'


import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'


import { useTransactionAdder } from '../../state/transactions/hooks'
import { getRedRequiemContract } from '../../utils'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { useGetRequiemAmount, useUserBalances } from '../../state/user/hooks'
import Page from '../Page'


const BoxLeft = styled(Box) <{ selected: boolean }>`
  width: ${({ selected }) => selected ? '60%' : '100%'};
  -webkit-transform-origin: top left; -webkit-transition: all 1s;
`

const BoxRight = styled(Box) <{ selected: boolean }>`
height: 100%;
justify-content: center;
align-items: center;
  margin-left: 20px;
  width: ${({ selected }) => selected ? '40%' : '0px'};
  height: ${({ selected }) => selected ? '100%' : '0px'};
  -webkit-transform-origin: top right; -webkit-transition: all 1s;
`

const BoxBottom = styled(Box) <{ selected: boolean }>`
  width: 100%;
  height: ${({ selected }) => selected ? '100%' : '0px'};
  -webkit-transform-origin: top right; -webkit-transition: all 1s;
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

const CardBottom = styled(Card)`
border-top-left-radius: 2px;
border-top-right-radius: 2px;
padding: 5px;
border-left: solid 2px white;
border-bottom: solid 2px white;
border-right: solid 2px white;
  width: 100%;
  height: 80px;
`

const ActionButton = styled(Button)`
border-radius: 5px;
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

  // const [tokenA, tokenB] = [useCurrency(chainId, currencyIdA) ?? undefined, useCurrency(chainId, currencyIdB) ?? undefined]
  const [tokenA, tokenB] = useMemo(
    () => [GREQ[chainId], USDC[chainId]],
    [chainId],
  )

  useEffect(() => {
    const _chain = getChain(chainId ?? 43113)
    if (chain !== _chain) {
      history.push(`/${_chain}/governance`)
    }

  },
    [chain, chainId, history],
  )

  const { isMobile } = useMatchBreakpoints()

  const { balance: redReqBal, staked, locks, dataLoaded, supplyABREQ, supplyGREQ, lockedInGovernance
  } = useGovernanceInfo(chainId, account)

  const totalReqLockedUser = useMemo(() => {
    const lockKeys = Object.keys(locks)
    let totalReqLocked = BigNumber.from(0);
    if (!dataLoaded) return '0'
    for (let i = 0; i < lockKeys.length; i++) {
      totalReqLocked = totalReqLocked.add(locks[lockKeys[i]].amount)
    }

    return formatEther(totalReqLocked)
  },
    [locks, dataLoaded]
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
        userStaked: formatEther(staking[key]?.userStaked ?? '0'),
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

  const { balances } = useUserBalances(chainId)

  const [parsedAmounts, manualPerc] = useMemo(() => {
    setInputType(InputType.absolute)

    const value = tryParseTokenAmount(inputValue, tokenA)
    const percentage = value ? Math.round(Number(formatEther(value.raw.mul('1000000000000000000').div(balances[tokenA.address].balance) ?? 1)) * 100) : 0
    return [{
      [Field.CURRENCY_A]: tryParseTokenAmount(inputValue, tokenA),
      [Field.CURRENCY_B]: tryParseTokenAmount(inputValue, tokenB)
    },
    Math.min(percentage, 100)
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, action, supplyABREQ, supplyGREQ])



  const parsedAmountsPercentage = useMemo(() => {
    setInputType(InputType.percent)
    if (!balances)
      return {
        [Field.CURRENCY_A]: new TokenAmount(tokenA, '0'),
        [Field.CURRENCY_B]: new TokenAmount(tokenB, '0')
      }

    const inputA = BigNumber.from(inputPercent).mul(balances[tokenA.address].balance).div(100)
    const inputB = BigNumber.from(inputPercent).mul(balances[tokenB.address].balance).div(100)
    return {
      [Field.CURRENCY_A]: new TokenAmount(tokenA, inputA),
      [Field.CURRENCY_B]: new TokenAmount(tokenB, inputB)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputPercent, action, supplyABREQ, supplyGREQ, balances])

  const finalAmount = useMemo(() => {
    return inputType === InputType.absolute ? parsedAmounts[Field.CURRENCY_A] : parsedAmountsPercentage[Field.CURRENCY_A]
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputType, parsedAmounts, parsedAmountsPercentage]
  )

  const { onDeposit } = useDeposit()
  const { onWithdrawAndHarvest } = useWithdrawAndHarvest()
  const atMaxAmount = parsedAmounts[Field.CURRENCY_A]?.equalTo(new Percent('1'))

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.CURRENCY_A], getGovernanceStakingAddress(chainId))

  const [approvalRreq, approveCallbackRreq] = useApproveCallback(
    chainId, account,
    new TokenAmount(GREQ[chainId], bn_maxer(Object.values(locks).map(l => l.minted)).toString()),
    getGovernanceStakingAddress(chainId)
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  // tx sending
  const addTransaction = useTransactionAdder()



  const buttonText = 'Stake GREQ'


  const titleText = action === Action.stake ? 'Staked!' : 'Withdrawl complete!'

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

    dispatch(fetchGovernanceUserDetails({ chainId, account }))
  }

  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  const summaryText = action === Action.stake ? `Stake ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)}` : `Withdraw ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)}`

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
    }
  }

  const otherValue = useMemo(() => {
    return inputType === InputType.absolute ? `${String(manualPerc)}%` : inputType === InputType.percent ? `${String(inputPercent)}%` : ''
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputType, manualPerc, inputPercent]
  )

  const bottomBox = (_stakeData: DataWithId): JSX.Element => {
    return (<CardBottom>
      <Flex flexDirection='row' height='50px' alignItems='space-between' justifyContent='space-between'>

        <Flex flexDirection='column'>
          <Text>Pending reward</Text>
          <Text>{_stakeData.pendingRewardUsd}</Text>
        </Flex>
        <ActionButton
          variant='primary'
          onClick={() => { return setAction(Action.withdraw === action ? Action.stake : Action.withdraw) }} // {onAttemptToApprove}
          width="80px"
          mr="0.5rem"
        >
          {action === Action.withdraw ? 'Deposit instead' : 'Withdraw instead'}
        </ActionButton>
      </Flex>
    </CardBottom>)
  }


  const dropdown = (): JSX.Element => {
    return (
      <DropdownContainer onClick={() => { setInputType(InputType.dropdown) }}>
        <DynamicSelect options={dropdownOptions}
          otherValue={otherValue}
          otherActive={!(inputType === InputType.dropdown)}
          onChange={({ label, value }: OptionProps) => {
            setInputType(InputType.dropdown)
            return onPercentageInput(value)
          }} />
      </DropdownContainer>
    )
  }

  const pendingText = action === Action.stake ? 'Staking' : 'Withdrawing'

  const inputPanel = (text, balanceText, stakedUser: string): JSX.Element => {
    return (
      <Flex flexDirection='column' marginRight={isMobile ? '0' : '20px'}>
        <Box my="2px" >
          <CurrencyInputPanelExpanded
            width='100%'
            balanceText={balanceText}
            balances={action === Action.stake ? { [tokenA.address]: new TokenAmount(tokenA, balances?.[tokenA.address]?.balance) } :
              { [tokenA.address]: new TokenAmount(tokenA, stakedUser) }}
            isLoading={isLoading}
            chainId={chainId}
            account={account}
            value={inputType === InputType.absolute ? inputValue : parsedAmountsPercentage[Field.CURRENCY_A]?.toSignificant(18)}
            onUserInput={val => {
              setInputType(InputType.absolute)
              return onCurrencyInput(val)
            }}
            onMax={() => onCurrencyInput(formatEther(action === Action.stake ? balances?.[tokenA.address]?.balance : balances?.[tokenA.address]?.balance))}
            showMaxButton={!atMaxAmount}
            currency={action === Action.stake ? tokenA : tokenB}
            label={text}
            // hideInput={action === Action.stake}
            // reducedLine={action === Action.stake}
            onCurrencySelect={() => { return null }}
            disableCurrencySelect
            id="input to stake"
          />
          <Flex flexDirection='row'>
            <Slider
              name="maturity-selector"
              min={0}
              max={100}
              step={1}
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
            <ConnectWalletButton align='center' height='27px' width='100%' />
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
                ) : approval === ApprovalState.LOADING || approvalRreq === ApprovalState.UNKNOWN ? (
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
    const props = approvalRreq !== ApprovalState.APPROVED && account ? { borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px', width: '60%' } : {}
    // used for layout of lock cards
    const indexMax = Object.values(Object.values(stakeData)).length - 1

    return (
      <Flex flexDirection='column' marginLeft={isMobile ? '0' : '20px'} maxHeight='1250px' minWidth='400px'>
        <GeneralLockContainer isMobile={isMobile}>
          {
            account && (
              Object.values(stakeData).map((data, index) => {

                return (
                  <Flex flexDirection='row' width='100%' justifyContent='space-between' alignItems='space-between'>
                    <BoxLeft selected={data.id === toggledPoolId}>
                      <StakingOption
                        stakeData={data}
                        onSelect={() => {
                          setAction(Action.stake)
                          toggleLock(true)
                          togglePid(data.id)
                        }}
                        reqPrice={reqPrice}
                        refTime={now}
                        isFirst={index === 0}
                        isLast={indexMax === index}
                        selected={data.id === toggledPoolId}
                        hideSelect={data.id === toggledPoolId}
                        hideActionButton={false}
                      />
                      <BoxBottom selected={data.id === toggledPoolId}>
                        {data.id === toggledPoolId && bottomBox(data)}
                      </BoxBottom>
                    </BoxLeft>

                    <BoxRight selected={data.id === toggledPoolId}>
                      {data.id === toggledPoolId && inputPanel(
                        <TransformText selected={action === Action.stake}>
                          {action === Action.stake ? `Select amount to Stake` : 'Input'}
                        </TransformText>,
                        action === Action.stake ? 'Balance' : 'Staked',
                        data.userStaked
                      )
                      }
                    </BoxRight>
                  </Flex>
                )
              }))
          }
        </GeneralLockContainer>

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
        {/* <Flex flexDirection={isMobile ? 'column' : 'row-reverse'} marginRight={isMobile ? '0px' : '20px'} marginTop='10px' alignItems='space-between' justifyContent='space-between'> */}
        {/* <Flex maxHeight='1150px' flexDirection='column' marginLeft={isMobile ? '' : '60px'} >
}
          </Flex> */}
        {renderStakeData()}
        {/* </Flex> */}

      </AppBodyFlex>
    </Page >
  )
}

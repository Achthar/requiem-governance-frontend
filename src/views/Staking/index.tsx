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
import { getGovernanceRequiemAddress } from 'utils/addressHelpers'
import Row from 'components/Row'
import getChain from 'utils/getChain'
import { useGetRawWeightedPairsState } from 'hooks/useGetWeightedPairsState'
import { priceAssetBackedRequiem } from 'utils/poolPricer'
import useRefresh from 'hooks/useRefresh'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { fetchGovernanceUserDetails } from 'state/governance/fetchGovernanceUserDetails'
import { useAppDispatch } from 'state'
import { AppHeader, AppBody, AppBodyFlex, AppHeaderFlex } from 'components/App'
import { Field } from 'config/constants/types'
import useToast from 'hooks/useToast'
import { formatEther } from 'ethers/lib/utils'
import { getStartDate, timeConverter } from 'utils/time'
import { bn_maxer, calculateVotingPower, get_amount_and_multiplier } from './helper/calculator'
import { StakingOption, FullStakeData, Action } from './components/stakingOption'
import { useCreateLock, useIncreaseMaturity, useIncreasePosition } from './hooks/transactWithLock'


import { RowBetween, RowFixed } from '../../components/Layout/Row'
import ConnectWalletButton from '../../components/ConnectWalletButton'


import { useTransactionAdder } from '../../state/transactions/hooks'
import { getRedRequiemContract } from '../../utils'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import Dots from '../../components/Loader/Dots'
import { useGetRequiemAmount } from '../../state/user/hooks'
import Page from '../Page'


const BoxLeft = styled(Box) <{ selected: boolean }>`
  width: ${({ selected }) => selected ? '60%' : '100%'};
  -webkit-transform-origin: top left; -webkit-transition: all 1s;
`

const BoxRight = styled(Box) <{ selected: boolean }>`
  margin-left: 20px;
  width: ${({ selected }) => selected ? '40%' : '0px'};
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
    () => [ABREQ[chainId], GREQ[chainId]],
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

  const {
    staking,
    stakingDataLoaded
  } = useStakingInfo(chainId, account)


  interface DataWithId extends FullStakeData {
    id?: number
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
        pendingReward: formatEther(staking[key]?.pendingReward ?? '0')
      }
    })
  }, [staking, stakingDataLoaded])

  useEffect(() => { console.log("STAKE", stakeData) }, [stakeData])

  const now = Math.round((new Date()).getTime() / 1000);

  // start time for slider - standardized to gmt midnight of next day
  const startTime = useMemo(() => { return getStartDate() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])


  // sets boolean for selected lock
  const [lockSelected, toggleLock] = useState(false)

  // sets selected lock end of existing user locks
  const [toggledPoolId, toggleLockId] = useState(9999)

  // define which action to take
  const [action, setAction] = useState(Action.stake)

  // value for currency input panel
  const [inputValue, onCurrencyInput] = useState('0')

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

  const [parsedAmounts, parsedMultiplier] = useMemo(() => {
    const input = BigNumber.from(tryParseTokenAmount(inputValue, tokenA)?.raw.toString() ?? 0)
    return [
      {
        [Field.CURRENCY_A]: tryParseTokenAmount(inputValue, tokenA),
        [Field.CURRENCY_B]: new TokenAmount(tokenB, inputValue)
      },
      input
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, action, supplyABREQ, supplyGREQ])


  const atMaxAmount = parsedAmounts[Field.CURRENCY_A]?.equalTo(new Percent('1'))

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(chainId, account, parsedAmounts[Field.CURRENCY_A], getGovernanceRequiemAddress(chainId))

  const [approvalRreq, approveCallbackRreq] = useApproveCallback(
    chainId, account,
    new TokenAmount(GREQ[chainId], bn_maxer(Object.values(locks).map(l => l.minted)).toString()),
    getGovernanceRequiemAddress(chainId)
  )

  const { balance, isLoading } = useGetRequiemAmount(chainId)

  // tx sending
  const addTransaction = useTransactionAdder()



  const buttonText = 'Stake GREQ'


  const titleText = action === Action.stake ? 'Staked!' : 'Withdrawl complete!'


  // function to create a lock or deposit on existing lock
  const transactWithLock = async () => {
    if (!chainId || !library || !account) return

    const redRequiemContract = getRedRequiemContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

    // // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    // if (action === Action.createLock) {
    //   await onCreateLock(parsedAmountA.toBigNumber().toHexString(), selectedMaturity)

    // } else if (action === Action.increaseAmount) {
    //   if (!lock)
    //     return;
    //   await onIncreasePosition(parsedAmountA.toBigNumber().toHexString(), lock)
    // }
    // else { // increase time
    //   if (!lock)
    //     return;
    //   await onIncreaseMaturity(parsedAmountA.toBigNumber().toHexString(), selectedMaturity, lock)
    // }

    dispatch(fetchGovernanceUserDetails({ chainId, account }))
  }

  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  // the final transaction function
  const transactionFunc = async () => {
    setPendingTx(true)
    try {
      // await transactWithLock()
      // toastSuccess(titleText, summaryText)
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

  const pendingText = action === Action.stake ? 'Staking' : 'Withdrawing'

  const inputPanel = (text, balanceText): JSX.Element => {
    return (
      <Flex flexDirection='column' marginRight={isMobile ? '0' : '20px'}>
        <Box my="2px" >

          <CurrencyInputPanelExpanded
            width='100%'
            balanceText={balanceText}
            balances={{ [ABREQ[chainId].address]: action === Action.stake ? balance : balance }}
            isLoading={isLoading}
            chainId={chainId}
            account={account}
            value={inputValue}
            onUserInput={onCurrencyInput}
            onMax={() => onCurrencyInput((action === Action.stake ? balance : balance)?.toSignificant(18))}
            showMaxButton={!atMaxAmount}
            currency={tokenA}
            label={text}
            // hideInput={action === Action.stake}
            // reducedLine={action === Action.stake}
            onCurrencySelect={() => { return null }}
            disableCurrencySelect
            id="input to lock"
          />
          <Slider
            name="maturity-selector"
            min={0}
            max={Number(balance.toSignificant(18))}
            step={1}
            value={10}
            onValueChanged={(val) => { return val }}
            width={isMobile ? '90%' : '95%'}
          />
        </Box>
        <Flex flexDirection='row'>
          {!account ? (
            <ConnectWalletButton align='center' height='27px' width='100%' />
          ) : (
            <RowBetween>
              <Button
                variant={approval === ApprovalState.APPROVED || signatureData !== null ? 'success' : 'primary'}
                onClick={approveCallback} // {onAttemptToApprove}
                disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                width="100%"
                mr="0.5rem"
              >
                {approval === ApprovalState.PENDING ? (
                  <Dots>Enabling</Dots>
                ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
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

  const renderLocks = (): JSX.Element => {
    const props = approvalRreq !== ApprovalState.APPROVED && account ? { borderTopRightRadius: '3px', borderBottomRightRadius: '3px', marginLeft: '3px', marginRight: '3px', marginBottom: '5px', width: '60%' } : {}
    // used for layout of lock cards
    const indexMax = Object.values(locks).length - 1

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
                          toggleLockId(data.id)
                        }}
                        reqPrice={reqPrice}
                        refTime={now}
                        isFirst={index === 0}
                        isLast={indexMax === index}
                        selected={data.id === toggledPoolId}
                        hideSelect={data.id === toggledPoolId}
                        hideActionButton={false}
                      />
                    </BoxLeft>
                    <BoxRight selected={data.id === toggledPoolId}>
                      {data.id === toggledPoolId && inputPanel(
                        <TransformText selected={action === Action.stake}>
                          {action === Action.stake ? `Select amount to Stake` : 'Input'}
                        </TransformText>,
                        action === Action.stake ? 'Locked' : 'Balance'
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
          subtitle={`Stake ${tokenB?.name ?? ''} to earn a profit share from the Requiem Protocol.`}
          noConfig
        />
        {/* <Flex flexDirection={isMobile ? 'column' : 'row-reverse'} marginRight={isMobile ? '0px' : '20px'} marginTop='10px' alignItems='space-between' justifyContent='space-between'> */}
        {/* <Flex maxHeight='1150px' flexDirection='column' marginLeft={isMobile ? '' : '60px'} >
}
          </Flex> */}
        {renderLocks()}
        {/* </Flex> */}

      </AppBodyFlex>
    </Page >
  )
}

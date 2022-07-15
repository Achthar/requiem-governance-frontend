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
import { useGovernanceInfo } from 'state/governance/hooks'
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
import { getStartDate, timeConverter } from 'utils/time'
import { bn_maxer, calculateVotingPower, get_amount_and_multiplier } from './helper/calculator'
import StakingOption from './components/stakingOption'
import { useCreateLock, useIncreaseMaturity, useIncreasePosition } from './hooks/transactWithLock'

import { Action } from './components/lockConfigurator'
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

  const now = Math.round((new Date()).getTime() / 1000);

  // start time for slider - standardized to gmt midnight of next day
  const startTime = useMemo(() => { return getStartDate() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])


  // select maturity with slider component
  const [selectedMaturity, onSelectMaturity] = useState(Math.round(startTime))

  // sets boolean for selected lock
  const [lockSelected, toggleLock] = useState(false)

  // sets selected lock end of existing user locks
  const [toggledLockId, toggleLockId] = useState(0)

  // define which action to take
  const [action, setAction] = useState(Action.createLock)

  // value for currency input panel
  const [inputValue, onCurrencyInput] = useState('0')

  const { slowRefresh } = useRefresh()

  // debouncer for slider
  const [maturity, selectMaturity] = useDebouncedChangeHandler(
    selectedMaturity,
    onSelectMaturity,
    200
  )

  // the user-selected lock
  const lock = useMemo(() => {
    return locks[toggledLockId]
  }, [locks, toggledLockId])


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

  const lockedAmount = useMemo(() => { return new TokenAmount(tokenA, lock?.amount ?? '0') }, [lock, tokenA])

  const [parsedAmounts, parsedMultiplier] = useMemo(() => {
    const input = BigNumber.from(tryParseTokenAmount(inputValue, tokenA)?.raw.toString() ?? 0)
    let voting: BigNumber
    try {
      voting = calculateVotingPower(action, now, input, selectedMaturity, lock, locks, BigNumber.from(supplyABREQ), BigNumber.from(supplyGREQ)).mul(input).div(ONE_18)
    } catch (Error) {
      console.log(Error)
      voting = BigNumber.from(0)
    }
    return [
      {
        [Field.CURRENCY_A]: tryParseTokenAmount(inputValue, tokenA),
        [Field.CURRENCY_B]: new TokenAmount(tokenB, voting && (voting.gte(0) ? voting : '0'))
      },
      input
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA, tokenB, inputValue, selectedMaturity, action, supplyABREQ, supplyGREQ])


  const formattedAmounts = useMemo(() => {
    return {
      [Field.CURRENCY_A]:
        parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]:
        parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    }
  }, [parsedAmounts])

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


  const titleText = action === Action.createLock ? 'Created Lock!' :
    action === Action.increaseAmount ? 'Added to Lock!' : 'Increased Maturity!'

  const summaryText = action === Action.createLock ? `Lock ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${ABREQ[chainId]?.name
    } for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${GREQ[chainId]?.name}` :
    action === Action.increaseAmount ? `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${ABREQ[chainId]?.name}` :
      `Add ${lock && (lock?.end - selectedMaturity) / 3600 / 24
      } days for ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${GREQ[chainId]?.name} to Lock`


  // transactions with lock
  const { onIncreaseMaturity } = useIncreaseMaturity()
  const { onIncreasePosition } = useIncreasePosition()
  const { onCreateLock } = useCreateLock()

  // function to create a lock or deposit on existing lock
  const transactWithLock = async () => {
    if (!chainId || !library || !account) return

    const redRequiemContract = getRedRequiemContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

    // we have to differentiate between addLiquidity and createPair (which also does directly add liquidity)
    if (action === Action.createLock) {
      await onCreateLock(parsedAmountA.toBigNumber().toHexString(), selectedMaturity)

    } else if (action === Action.increaseAmount) {
      if (!lock)
        return;
      await onIncreasePosition(parsedAmountA.toBigNumber().toHexString(), lock)
    }
    else { // increase time
      if (!lock)
        return;
      await onIncreaseMaturity(parsedAmountA.toBigNumber().toHexString(), selectedMaturity, lock)
    }

    dispatch(fetchGovernanceUserDetails({ chainId, account }))
  }

  const { toastSuccess, toastError } = useToast()
  const [pendingTx, setPendingTx] = useState(false)

  // the final transaction function
  const transactionFunc = async () => {
    setPendingTx(true)
    try {
      await transactWithLock()
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

  const pendingText = action === Action.createLock ? 'Creating Lock' : action === Action.increaseTime ? 'Increasing time' : 'Adding to Lock'

  const inputPanel = (): JSX.Element => {
    return (
      <Flex flexDirection='column' marginRight={isMobile ? '0' : '20px'}>
        <Box my="16px" >

          <CurrencyInputPanelExpanded
            width='100%'
            balanceText={action === Action.increaseTime ? 'Locked' : 'Balance'}
            balances={{ [ABREQ[chainId].address]: action === Action.increaseTime ? lockedAmount : balance }}
            isLoading={isLoading}
            chainId={chainId}
            account={account}
            value={inputValue}
            onUserInput={onCurrencyInput}
            onMax={() => onCurrencyInput((action === Action.increaseTime ? lockedAmount : balance)?.toSignificant(18))}
            showMaxButton={!atMaxAmount}
            currency={tokenA}
            label={action === Action.increaseTime ? `Select amount ${tokenA.symbol} locked` : 'Input'}
            // hideInput={action === Action.increaseTime}
            // reducedLine={action === Action.increaseTime}
            onCurrencySelect={() => { return null }}
            disableCurrencySelect
            id="input to lock"
          />
        </Box>
        <Flex flexDirection='row' marginTop='5px'>
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
                  (!!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]) || (action === Action.increaseTime)
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
              Object.values(locks).map((lockData, index) => {

                return (
                  <Flex flexDirection='row' width='100%' justifyContent='space-between' alignItems='space-between'>
                    <BoxLeft selected={lockData.id === toggledLockId}>
                      <StakingOption
                        token={USDC[chainId]}
                        stakeToken={ABREQ[chainId]}
                        chainId={chainId}
                        account={account}
                        lock={lockData}
                        onSelect={() => {
                          setAction(Action.increaseTime)
                          toggleLock(true)
                          selectMaturity(lockData.end)
                          toggleLockId(lockData.id)
                        }}
                        reqPrice={reqPrice}
                        refTime={now}
                        isFirst={index === 0}
                        isLast={indexMax === index}
                        selected={lockData.id === toggledLockId}
                        hideSelect={lockData.id === toggledLockId}
                        approval={approvalRreq}
                        approveCallback={approveCallbackRreq}
                        hideActionButton={false}
                        toggleLock={toggleLock}
                      />
                    </BoxLeft>
                    <BoxRight selected={lockData.id === toggledLockId}>
                      {lockData.id === toggledLockId && inputPanel()}
                    </BoxRight>
                  </Flex>
                )
              }))
          }
        </GeneralLockContainer>

      </Flex >
    )
  }


  const configStartDate = useMemo(() => {

    switch (action) {
      case Action.increaseTime: {
        return lock.end;
      }
      case Action.increaseAmount: {
        return startTime;
      }
      case Action.createLock: {
        return startTime;
      }
      default: {
        return startTime;
      }
    }
  }, [startTime, lock, action])

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

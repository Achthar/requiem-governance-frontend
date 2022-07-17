import React, { lazy, useCallback } from 'react'
import { Router, Redirect, Route, Switch } from 'react-router-dom'
import { ResetCSS } from '@requiemswap/uikit'
import BigNumber from 'bignumber.js'
import useEagerConnect from 'hooks/useEagerConnect'
import { usePollBlockNumber } from 'state/block/hooks'
import { DatePickerPortal } from 'components/DatePicker'
import Popups from 'components/Popups'
import SuspenseWithChunkError from './components/SuspenseWithChunkError'
import { ToastListener } from './contexts/ToastsContext'
import PageLoader from './components/Loader/PageLoader'
import history from './routerHistory'
import CustomNav from './CustomMenu'
import Balances from './Balances'
import GlobalStyle from './style/Global'

// Route-based code splitting
// Only pool is included in the main bundle because of it's the most visited page
const Home = lazy(() => import('./views/Home'))
const Vote = lazy(() => import('./views/Voting'))
const NotFound = lazy(() => import('./views/NotFound'))
const Governance = lazy(() => import('./views/Governance'))
const Staking = lazy(() => import('./views/Staking'))
const Liquidity = lazy(() => import('./views/Pool/poolList'))

// This config is required for number formatting
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

const App: React.FC = () => {
  usePollBlockNumber()
  useEagerConnect()

  return (
    <Router history={history}>
      <ResetCSS />
      <GlobalStyle />
      {/* <CustomMenu /> */}
      <video id="background-video" autoPlay loop muted poster="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractalStatic.jpg">
        <source src="https://requiem-finance.s3.eu-west-2.amazonaws.com/background/fractal2.0.mp4" type="video/mp4" />
      </video>
      <SuspenseWithChunkError fallback={<PageLoader />}>
        <Popups />
        {/* <Web3ReactManager> */}

        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          {/* Using this format because these components use routes injected props. We need to rework them with hooks */}
          <Route exact strict path="/:chain/liquidity" component={Liquidity} />
          <Route exact path="/:chain/voting" component={Vote} />
          <Route exact path="/:chain/governance" component={Governance} />
          <Route exact path="/:chain/staking" component={Staking} />
          {/* Redirect */}
          <Route path="/pool">
            <Redirect to="/:chain/liquidity" />
          </Route>

          {/* 404 */}
          <Route component={NotFound} />
        </Switch>
        <Balances />
        {/* </Web3ReactManager> */}
        <CustomNav />
      </SuspenseWithChunkError>
      <ToastListener />
      <DatePickerPortal />
    </Router>
  )
}

export default React.memo(App)

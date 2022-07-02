import { Flex } from '@requiemswap/uikit'
import PageMeta from 'components/Layout/Page'
import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useNetworkState } from 'state/globalNetwork/hooks'
import styled from 'styled-components'
import getChain from 'utils/getChain'
import Footer from './components/Footer'
import Hero from './components/Hero'
import { Proposals } from './components/Proposals'

const Chrome = styled.div`
  flex: none;
`

const Content = styled.div`
  flex: 1;
  height: 100%;
`

const Voting = ({
  history,
  match: {
    params: { chain },
  },
}: RouteComponentProps<{ chain: string }>) => {

  const { chainId } = useNetworkState()

  useEffect(() => {
    const _chain = chain ?? getChain(chainId)
    history.push(`/${_chain}/voting`)

  },
    [chainId, chain, history],
  )


  return (
    <>
      {/* <PageMeta />
      <Flex flexDirection="column" minHeight="calc(100vh - 64px)"> */}
        {/* <Chrome>
          <Hero />
        </Chrome> */}
        {/* <Content> */}
          <Proposals />
        {/* </Content> */}
        {/* <Chrome>
          <Footer />
        </Chrome> */}
      {/* </Flex> */}
    </>
  )
}

export default Voting

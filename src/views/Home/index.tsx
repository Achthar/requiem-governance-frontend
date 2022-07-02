/* eslint react/no-children-prop: 0 */
import React from 'react'
import styled from "styled-components";
import PageSection from 'components/PageSection'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody, useMatchBreakpoints, Flex } from '@requiemswap/uikit'
import { Status } from '@requiemswap/uikit/src/components/Stepper/types'
import Row from 'components/Row'


const RequiemImage = styled.img`
  width: 50%;
`;

const Home: React.FC = () => {
  const { isMobile } = useMatchBreakpoints()


  const intro = 'Requiem Finance is a decentralized platform that will give traders easy access to the most powerful tools in DeFi. At its core, it is a decentralized exchange with a stable swap built-in -ensuring traders get access to the best pricing. We already have a beta of our DEX  deployed on the AVAX testnet on requiem.finance. However, this is just the beginning. The following features are on our immediate release roadmap:'

  const outlook = 'These features are the ones we have chosen to tackle first, however, we aim to continuously innovate to be the most sophisticated trading platform DeFi has to offer. At the moment, we are a small team of engineers and ex-CeFi employees but we hope that with your support, we can attract additional experienced individuals to join us on our journey.'
  const status: Status[] = ['past', 'past', 'past', 'past', 'past', 'current', 'future']

  const titleFont = {
    lineHeight: 1.2,
    fontSize: '60px',
    bold: true,
    fontWeight: 600,
  }

  const mobileIconStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  }

  const iconStyle = isMobile ? mobileIconStyle : {}

  return (
    <>
      <PageSection
        innerProps={{
          style: { margin: '0', width: '100%', maxWidth: '1000px' },
        }}
        index={2}
        hasCurvedDivider={false}
      >
        <Container width="100%" maxWidth="25000px" style={{ marginBottom: 60 }}>
          <div
            style={{
              justifyContent: 'center'
            }}
          >
            <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent='center' alignItems='center'>
                <RequiemImage
                  src='https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/requiem-finance.svg'
                />
           
              <Text fontSize={isMobile ? "44px" : "64px"} color='white' marginBottom='10px' bold textAlign='center'>
                Governance
              </Text>
            </Flex>
          </div>
          <Text fontSize={isMobile ? "14px" : "24px"} color='white' marginBottom='10px'>
            {intro}
          </Text>

          <Text fontSize={isMobile ? "14px" : "24px"} color='white' marginTop='10px'>
            {outlook}
          </Text>
        </Container>

        {/* <ReactMarkdown children={getText()} /> */}

        {/*
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper top fill={theme.isDark ? '#201335' : '#D8CBED'}>
            <WedgeTopLeft />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...swapSectionData} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        index={2}
        hasCurvedDivider={false}
      >
        <OuterWedgeWrapper>
          <InnerWedgeWrapper width="150%" top fill={theme.colors.background}>
            <WedgeTopRight />
          </InnerWedgeWrapper>
        </OuterWedgeWrapper>
        <SalesSection {...earnSectionData} />
        <FarmsPoolsRow {...chainId} />
      </PageSection>
      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <SalesSection {...REQTSectionData} />
        <REQTDataRow />
      </PageSection> */}
      </PageSection>
    </>
  )
}

export default Home

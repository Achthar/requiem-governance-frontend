/* eslint react/no-children-prop: 0 */
import React from 'react'
import styled from "styled-components";
import PageSection from 'components/PageSection'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody, useMatchBreakpoints, Flex } from '@requiemswap/uikit'
import { Status } from '@requiemswap/uikit/src/components/Stepper/types'
import Row from 'components/Row'


const RequiemImage = styled.img`
  width: 100%;
`;

const Home: React.FC = () => {
  const { isMobile } = useMatchBreakpoints()


  const intro = 'The Requiem Finance Protocol is governed by the Governance Requiem Token (GREQ). That token can be minted when locking abREQ. At max, one GREQ can be minted for one abREQ where the exact amount you obtain depends on the amount of time you decide to lock abREQ. abREQ can be withdrawn early, but with a hefty penalty.'

  const outlook = 'The penalties collected will partly be burnt and also used to redistribute for yield farming to increase engagement on the platform without inflating abREQ itself.'
 
  const locking = 'We allow the creating of multiple locks/locked positions so that you can flexibly decide on which mouynt to lock for a specific amount of time. As explained above, the amount of time abREQ is locked determines the amount of GREQ minted, where more specifically, the amount minted increases exponentially the longer you decide to lock it.'
  
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

            <RequiemImage
              src='https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/requiem-governance-header.svg'
            />

          </div>
          <Text fontSize={isMobile ? "14px" : "24px"} color='white' marginBottom='10px'>
            {intro}
          </Text>

          <Text fontSize={isMobile ? "14px" : "24px"} color='white' marginTop='10px'>
            {outlook}
          </Text>
          <Text fontSize={isMobile ? "14px" : "24px"} color='white' marginTop='10px'>
            {locking}
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

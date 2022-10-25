/* eslint react/no-children-prop: 0 */
import React from 'react'
import styled from "styled-components";
import PageSection from 'components/PageSection'
import Container from 'components/Layout/Container'
import { Text, Step, Stepper, Card, CardBody, useMatchBreakpoints, Flex } from '@requiemswap/uikit'
import { Status } from '@requiemswap/uikit/src/components/Stepper/types'
import greqHeader from '../../assets/requiem-governance-header.svg'


const RequiemImage = styled.img`
  width: 100%;
`;

const Home: React.FC = () => {
  const { isMobile } = useMatchBreakpoints()


  const intro = `The Requiem Finance Protocol is governed by the Governance Requiem Token (GREQ). 
  That token can be minted when locking abREQ. 
  At max, one GREQ can be minted for one abREQ where the exact amount you obtain depends on the amount of time you decide to lock abREQ. 
  abREQ can be withdrawn early, but with a hefty penalty.`

  const outlook = `The penalties collected will partly be burnt and also used to redistribute for yield farming to increase engagement on the platform without inflating abREQ itself.`

  const locking = `We allow the creating of multiple locks/locked positions so that you can flexibly decide on which mouynt to lock for a specific amount of time. 
  As explained above, the amount of time abREQ is locked determines the amount of GREQ minted, where more specifically, 
  the amount minted increases exponentially the longer you decide to lock it.`

  const status: Status[] = ['past', 'past', 'past', 'future']

  const headers = ['Get ABREQ', 'Lock ABREQ for GREQ', 'Stake GREQ and Earn', 'Propose and Vote!']

  const steps = [
    'You can get abREQ on our exchange or by selling assets to our treasury using bonds',
    'Lock abREQ for some time to mint GREQ. Be careful with considerng for how long you wan to lock as there is a penalty on early withdrawals.',
    'Stake GREQ to earn rewards paid out in valuable assets such as USDC or WETH.',
    'Maximize and use your voting power to impact the direction the Requiem Finance Protocol will go.'
  ]


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

  const headerColor = 'rgba(255, 40, 40, 0.5)';

  return (
    <>
      <PageSection
        innerProps={{
          style: { margin: '0', width: '100%', maxWidth: '1000px' },
        }}
        index={2}
        hasCurvedDivider={false}
      >
        <Container width="100%" maxWidth="25000px" style={{ marginBottom: 10 }}>
          <div
            style={{
              justifyContent: 'center'
            }}
          >

            <RequiemImage
              src={greqHeader}
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
          <Text fontSize={isMobile ? "14px" : "24px"} color='rgba(255, 40, 40, 0.75)' marginTop='10px' bold>
            The following steps are necessary to earn from the Requiem Protocol:
          </Text>
        </Container>

        <Stepper>
          {steps.map((step, index) => (
            <Step key={step} index={index} status={status[index]}>
              <Card>
                <CardBody>
                  <Text fontSize="24px" textTransform="capitalize" bold color={headerColor}>
                    {headers[index]}
                  </Text>
                  <Text>
                    {step}
                  </Text>
                </CardBody>
              </Card>
            </Step>
          ))}
        </Stepper>
      </PageSection>
    </>
  )
}

export default Home

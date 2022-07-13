import React from 'react'
import styled from 'styled-components'
import { Box, Card } from '@requiemswap/uikit'

export const BodyWrapper = styled(Box) <{ isMobile: boolean }>`
background-color: rgba(0, 0, 0, 0.25);
border-radius: 24px;
max-width: ${({ isMobile }) => isMobile ? '436px': '900px'};
width: 100%;
z-index: 1;
${({ isMobile }) => isMobile ? '': 'max-height: 1300px'}
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBodyFlex({ children, isMobile }: { children: React.ReactNode, isMobile }) {
  return <BodyWrapper isMobile={isMobile}>{children}</BodyWrapper>
}

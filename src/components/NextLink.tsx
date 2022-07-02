import React, { forwardRef } from 'react'
import styled from 'styled-components'
// import NextLink from 'next/link'

// react-router-dom LinkProps types
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: any
  replace?: boolean
  innerRef?: React.Ref<HTMLAnchorElement>
  // next
  prefetch?: boolean
}

const A = styled.a``

/**
 * temporary solution for migrating React Router to Next.js Link
 */
export const NextLinkFromReactRouter = forwardRef<any, LinkProps>(
  ({ to, replace, children, prefetch, ...props }, ref) => (
    <>
      <A ref={ref} {...props}>
        {children}
      </A>
    </>
  ),
)

import React from 'react'
import { ArrowBackIcon, Box, Button, Flex, Heading } from '@requiemswap/uikit'
import PageMeta from 'components/Layout/Page'
import { getAllVotes, getProposal } from 'state/voting/helpers'
import { useWeb3React } from '@web3-react/core'
import useSWRImmutable from 'swr/immutable'
import { ProposalState } from 'state/types'
// import Link from 'next/link'
// import { useRouter } from 'next/router'
import { useTranslation } from 'contexts/Localization'
import Container from 'components/Layout/Container'
import ReactMarkdown from 'components/ReactMarkdown'
import NotFound from 'views/NotFound'
import PageLoader from 'components/Loader/PageLoader'
import { FetchStatus } from 'config/constants/types'
import { isCoreProposal } from '../helpers'
import { ProposalStateTag, ProposalTypeTag } from '../components/Proposals/tags'
import Layout from '../components/Layout'
import Details from './Details'
import Results from './Results'
import Vote from './Vote'
import Votes from './Votes'

const Overview = () => {
  // const { query, isFallback } = useRouter()
  // const id = query.id as string
  const { t } = useTranslation()
  const { account } = useWeb3React()

  // const {
  //   data: proposal,
  //   error,
  // } = useSWRImmutable(id ? ['proposal', id] : null, () => getProposal(id))

  const proposal = {
    author: 'string',
    body: 'string',
    choices: ['string', '12'],
    end: 213321321,
    id: 'string',
    snapshot: 'string',
    space: {
      id: 'string',
      name: 'string'
    },
    votes: 123132,
    start: 213211,
    state: ProposalState.ACTIVE,
    title: 'title',
  }


  const {
    data: votes,
    mutate: refetch,
  } = useSWRImmutable(proposal ? ['proposal', proposal, 'votes'] : null, async () => getAllVotes(proposal))
  const hasAccountVoted = account && votes && votes.some((vote) => vote.voter.toLowerCase() === account.toLowerCase())

  const isPageLoading = !votes || !proposal

  if (!proposal) {
    return <NotFound />
  }

  // if (isFallback || !proposal) {
  //   return <PageLoader />
  // }

  return (
    <Container py="40px">
      <PageMeta />
      <Box mb="40px">
        {/* <Link href="/voting" passHref> */}
        <Button as="a" variant="text" startIcon={<ArrowBackIcon color="primary" width="24px" />} px="0">
          {t('Back to Vote Overview')}
        </Button>
        {/* </Link> */}
      </Box>
      <Layout>
        <Box>
          <Box mb="32px">
            <Flex alignItems="center" mb="8px">
              <ProposalStateTag proposalState={proposal.state} />
              <ProposalTypeTag isCoreProposal={isCoreProposal(proposal)} ml="8px" />
            </Flex>
            <Heading as="h1" scale="xl" mb="16px">
              {proposal.title}
            </Heading>
            <Box>
              <ReactMarkdown>{proposal.body}</ReactMarkdown>
            </Box>
          </Box>
          {!isPageLoading && !hasAccountVoted && proposal.state === ProposalState.ACTIVE && (
            <Vote proposal={proposal} onSuccess={refetch} mb="16px" />
          )}
          <Votes votes={votes} totalVotes={votes?.length ?? proposal.votes} votesLoadingStatus={!votes ? FetchStatus.Fetched : FetchStatus.Fetched} />
        </Box>
        <Box position="sticky" top="60px">
          <Details proposal={proposal} />
          <Results choices={proposal.choices} votes={votes} votesLoadingStatus={!votes ? FetchStatus.Fetched : FetchStatus.Fetched} />
        </Box>
      </Layout>
    </Container>
  )
}

export default Overview

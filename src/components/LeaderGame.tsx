'use client'

import { useCallback, useEffect } from 'react'
import { Board } from '@/components/Board'
import { Lobby } from '@/components/Lobby'
import { ReviewModal } from '@/components/ReviewModal'
import { RoundHeader } from '@/components/RoundHeader'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { RoundItem, SubmissionForReview, Team } from '@/types'

type LeaderGameInnerProps = {
  gamePin: string
  leaderPin: string
}

function LeaderGameInner({ gamePin, leaderPin }: LeaderGameInnerProps) {
  const socket = useSocket()
  const { state, dispatch } = useGame()

  useEffect(() => {
    if (!socket) return

    let leaderName: string | undefined
    try {
      const session = localStorage.getItem('scout-bingo-session')
      if (session) {
        const parsed = JSON.parse(session) as { leaderName?: string }
        leaderName = parsed.leaderName
      }
    } catch {
      // localStorage unavailable
    }

    if (leaderName) {
      socket.emit('lobby:join', { gamePin, leaderPin, leaderName })
    }

    const handleLobbyJoined = (payload: {
      gameId: string
      leaderName: string
    }) => {
      dispatch({
        type: 'LOBBY_JOINED',
        teamId: '',
        teamName: payload.leaderName,
        teamColour: '',
      })
    }

    const handleLobbyTeams = ({ teams }: { teams: Team[] }) => {
      dispatch({ type: 'LOBBY_TEAMS', teams })
    }

    const handleGameStarted = (payload: {
      board: RoundItem[]
      roundStartedAt: string
    }) => {
      dispatch({
        type: 'GAME_STARTED',
        items: payload.board,
        roundStartedAt: payload.roundStartedAt,
      })
    }

    const handleSquarePending = (payload: { roundItemId: string }) => {
      dispatch({
        type: 'SQUARE_PENDING',
        roundItemId: payload.roundItemId,
      })
    }

    const handleReviewSubmission = (payload: SubmissionForReview) => {
      dispatch({
        type: 'REVIEW_PROMOTED',
        roundItemId: payload.roundItemId,
        submission: payload,
      })
    }

    socket.on('lobby:joined', handleLobbyJoined)
    socket.on('lobby:teams', handleLobbyTeams)
    socket.on('game:started', handleGameStarted)
    socket.on('square:pending', handleSquarePending)
    socket.on('review:submission', handleReviewSubmission)

    return () => {
      socket.off('lobby:joined', handleLobbyJoined)
      socket.off('lobby:teams', handleLobbyTeams)
      socket.off('game:started', handleGameStarted)
      socket.off('square:pending', handleSquarePending)
      socket.off('review:submission', handleReviewSubmission)
    }
  }, [socket, dispatch, gamePin, leaderPin])

  const handleStartRound = useCallback(() => {
    if (!socket) return
    socket.emit('game:start', {})
  }, [socket])

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      if (!socket) return
      const item = state.board.find((i) => i.roundItemId === roundItemId)
      if (!item) return
      if (item.claimedByTeamId !== null) return
      if (!item.hasPendingSubmissions) return
      if (item.lockedByLeader !== null) return
      socket.emit('review:open', { roundItemId })
    },
    [socket, state.board],
  )

  const handleEndRound = useCallback(() => {
    if (!socket) return
    socket.emit('game:end', {})
  }, [socket])

  const handleApprove = useCallback(
    (submissionId: string) => {
      if (!socket) return
      socket.emit('review:approve', { submissionId })
    },
    [socket],
  )

  const handleReject = useCallback(
    (submissionId: string) => {
      if (!socket) return
      socket.emit('review:reject', { submissionId })
    },
    [socket],
  )

  const handleDismiss = useCallback(() => {
    if (!socket || !state.reviewingRoundItemId) return
    socket.emit('review:close', { roundItemId: state.reviewingRoundItemId })
    dispatch({ type: 'REVIEW_CLOSED' })
  }, [socket, state.reviewingRoundItemId, dispatch])

  switch (state.status) {
    case 'lobby':
      return (
        <Lobby
          role="leader"
          myTeam={null}
          teams={state.teams}
          gamePin={gamePin}
          leaderPin={leaderPin}
          onStartRound={handleStartRound}
        />
      )
    case 'active':
      return (
        <div className="flex h-[calc(100dvh)] flex-col">
          <RoundHeader
            roundStartedAt={state.roundStartedAt ?? new Date().toISOString()}
            board={state.board}
            onEndRound={handleEndRound}
          />
          <Board
            items={state.board}
            role="leader"
            myTeamId={null}
            onSquareTap={handleSquareTap}
          />
          {state.currentSubmission && (
            <ReviewModal
              submission={state.currentSubmission}
              open={state.reviewingRoundItemId !== null}
              onApprove={handleApprove}
              onReject={handleReject}
              onDismiss={handleDismiss}
            />
          )}
        </div>
      )
    case 'ended':
      return <div>Game Summary</div>
    default:
      return <div>Loading...</div>
  }
}

type LeaderGameProps = {
  gameId: string
  gamePin: string
  leaderPin: string
}

export function LeaderGame({ gameId, gamePin, leaderPin }: LeaderGameProps) {
  return (
    <GameProvider>
      <LeaderGameInner gamePin={gamePin} leaderPin={leaderPin} />
    </GameProvider>
  )
}

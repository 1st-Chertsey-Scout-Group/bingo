'use client'

import { useCallback, useEffect } from 'react'
import { Board } from '@/components/Board'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { Lobby } from '@/components/Lobby'
import { Button } from '@/components/ui/button'
import { ReviewModal } from '@/components/ReviewModal'
import { RoundHeader } from '@/components/RoundHeader'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { RoundItem, SubmissionForReview, Team, TeamSummary } from '@/types'

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

    const handleSquareLocked = (payload: {
      roundItemId: string
      leaderName: string
    }) => {
      dispatch({
        type: 'SQUARE_LOCKED',
        roundItemId: payload.roundItemId,
        leaderName: payload.leaderName,
      })
    }

    const handleSquareUnlocked = (payload: { roundItemId: string }) => {
      dispatch({
        type: 'SQUARE_UNLOCKED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleSquareClaimed = (payload: {
      roundItemId: string
      teamId: string
      teamName: string
      teamColour: string
    }) => {
      dispatch({
        type: 'SQUARE_CLAIMED',
        roundItemId: payload.roundItemId,
        teamId: payload.teamId,
        teamName: payload.teamName,
        teamColour: payload.teamColour,
      })
    }

    const handleGameEnded = (payload: { summary: TeamSummary[] }) => {
      dispatch({ type: 'GAME_ENDED', summary: payload.summary })
    }

    const handleGameLobby = () => {
      try {
        const session = localStorage.getItem('scout-bingo-session')
        if (session) {
          const parsed = JSON.parse(session) as Record<string, unknown>
          delete parsed.teamId
          localStorage.setItem('scout-bingo-session', JSON.stringify(parsed))
        }
      } catch {
        // localStorage unavailable
      }
      dispatch({ type: 'GAME_LOBBY' })
      // Re-join lobby
      if (leaderName) {
        socket.emit('lobby:join', { gamePin, leaderPin, leaderName })
      }
    }

    socket.on('lobby:joined', handleLobbyJoined)
    socket.on('lobby:teams', handleLobbyTeams)
    socket.on('game:started', handleGameStarted)
    socket.on('square:pending', handleSquarePending)
    socket.on('review:submission', handleReviewSubmission)
    socket.on('square:locked', handleSquareLocked)
    socket.on('square:unlocked', handleSquareUnlocked)
    socket.on('square:claimed', handleSquareClaimed)
    socket.on('game:ended', handleGameEnded)
    socket.on('game:lobby', handleGameLobby)

    return () => {
      socket.off('lobby:joined', handleLobbyJoined)
      socket.off('lobby:teams', handleLobbyTeams)
      socket.off('game:started', handleGameStarted)
      socket.off('square:pending', handleSquarePending)
      socket.off('review:submission', handleReviewSubmission)
      socket.off('square:locked', handleSquareLocked)
      socket.off('square:unlocked', handleSquareUnlocked)
      socket.off('square:claimed', handleSquareClaimed)
      socket.off('game:ended', handleGameEnded)
      socket.off('game:lobby', handleGameLobby)
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

  const handleNewRound = useCallback(() => {
    if (!socket) return
    socket.emit('game:newround', {})
  }, [socket])

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
      return (
        <div className="flex h-[calc(100dvh)] flex-col items-center justify-center p-6">
          <h1 className="mb-6 text-2xl font-bold">Round Over</h1>
          <div className="w-full max-w-md space-y-3">
            {(state.summary ?? []).map((team, index) => (
              <div
                key={team.teamId}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="text-muted-foreground w-6 text-right text-lg font-bold">
                  {index + 1}
                </span>
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: team.teamColour }}
                />
                <span className="flex-1 font-medium">{team.teamName}</span>
                <span className="text-muted-foreground text-sm">
                  {team.claimedCount}{' '}
                  {team.claimedCount === 1 ? 'square' : 'squares'}
                </span>
              </div>
            ))}
          </div>
          <Button className="mt-8" size="lg" onClick={handleNewRound}>
            New Round
          </Button>
        </div>
      )
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
      <ConnectionBanner />
      <LeaderGameInner gamePin={gamePin} leaderPin={leaderPin} />
    </GameProvider>
  )
}

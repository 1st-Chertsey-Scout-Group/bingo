'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Board } from '@/components/Board'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Lobby } from '@/components/Lobby'
import { LogPanel } from '@/components/LogPanel'
import { Button } from '@/components/ui/button'
import { ReviewModal } from '@/components/ReviewModal'
import { RoundHeader } from '@/components/RoundHeader'
import { TeamMapDynamic } from '@/components/TeamMapDynamic'
import { useActivityLog } from '@/hooks/useActivityLog'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useLeaderSocket } from '@/hooks/useLeaderSocket'
import { useSocket } from '@/hooks/useSocket'
import { useTeamPositions } from '@/hooks/useTeamPositions'
import { GAME_STATUS } from '@/lib/constants'
import { loadSession } from '@/lib/session'

type LeaderGameInnerProps = {
  gamePin: string
  leaderPin: string
}

function LeaderGameInner({ gamePin, leaderPin }: LeaderGameInnerProps) {
  const router = useRouter()

  useEffect(() => {
    const session = loadSession()
    if (!session || session.role !== 'leader' || session.gamePin !== gamePin) {
      router.replace('/')
    }
  }, [gamePin, router])
  const socket = useSocket()
  const { state, dispatch } = useGame()

  const { entries: logEntries, addEntry: addLogEntry } = useActivityLog()

  useLeaderSocket(socket, dispatch, gamePin, leaderPin, addLogEntry)
  const positions = useTeamPositions(socket, addLogEntry)
  const [mapOpen, setMapOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const handleToggleMap = useCallback(() => {
    setMapOpen((prev) => !prev)
  }, [])

  const handleToggleLog = useCallback(() => {
    setLogOpen((prev) => !prev)
  }, [])

  const handlePreviewBoard = useCallback(
    (categories: string[], boardSize: number, templateCount: number) => {
      if (!socket) return
      socket.emit('board:preview', { categories, boardSize, templateCount })
    },
    [socket],
  )

  const handleRefreshItem = useCallback(
    (index: number, categories: string[]) => {
      if (!socket || !state.previewBoard) return
      socket.emit('board:refresh-item', {
        currentBoard: state.previewBoard,
        indexToReplace: index,
        categories,
      })
    },
    [socket, state.previewBoard],
  )

  const handleClearPreview = useCallback(() => {
    dispatch({ type: 'BOARD_PREVIEW_CLEAR' })
  }, [dispatch])

  const handleStartRound = useCallback(() => {
    if (!socket) return
    if (state.previewBoard) {
      socket.emit('game:start', { confirmedBoard: state.previewBoard })
    } else {
      socket.emit('game:start', {})
    }
  }, [socket, state.previewBoard])

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

  const handleToggleTeamLock = useCallback(
    (locked: boolean) => {
      if (!socket) return
      socket.emit('team:lock', { locked })
    },
    [socket],
  )

  switch (state.status) {
    case GAME_STATUS.LOBBY:
      return (
        <Lobby
          role="leader"
          myTeam={null}
          teams={state.teams}
          teamsLocked={state.teamsLocked}
          gamePin={gamePin}
          leaderPin={leaderPin}
          previewBoard={state.previewBoard}
          onPreviewBoard={handlePreviewBoard}
          onRefreshItem={handleRefreshItem}
          onStartRound={handleStartRound}
          onClearPreview={handleClearPreview}
          onToggleTeamLock={handleToggleTeamLock}
        />
      )
    case GAME_STATUS.ACTIVE:
      return (
        <div className="flex h-[calc(100dvh)] flex-col">
          <RoundHeader
            roundStartedAt={state.roundStartedAt ?? new Date().toISOString()}
            board={state.board}
            onEndRound={handleEndRound}
            onToggleMap={handleToggleMap}
            mapOpen={mapOpen}
            onToggleLog={handleToggleLog}
            logOpen={logOpen}
          />
          {mapOpen && (
            <div className="h-[45dvh] shrink-0 border-b">
              <TeamMapDynamic positions={positions} />
            </div>
          )}
          {logOpen && (
            <div className="h-[45dvh] shrink-0 border-b">
              <LogPanel entries={logEntries} />
            </div>
          )}
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
    case GAME_STATUS.ENDED:
      return (
        <div className="flex h-[calc(100dvh)] flex-col items-center justify-center p-6">
          <h1 className="mb-6 text-3xl font-extrabold">Round Over</h1>
          <div className="w-full max-w-md space-y-3">
            {(state.summary ?? []).map((team, index) => (
              <div
                key={team.teamId}
                className={`flex items-center gap-3 rounded-xl border-2 p-3.5 shadow-sm ${
                  index === 0
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <span
                  className={`w-7 text-right text-lg font-extrabold ${
                    index === 0 ? 'text-amber-500' : 'text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className="h-5 w-5 shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: team.teamColour }}
                />
                <span className="flex-1 font-bold">{team.teamName}</span>
                <span className="text-sm font-semibold text-gray-500">
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
  gamePin: string
  leaderPin: string
}

export function LeaderGame({ gamePin, leaderPin }: LeaderGameProps) {
  return (
    <ErrorBoundary>
      <GameProvider>
        <ConnectionBanner />
        <LeaderGameInner gamePin={gamePin} leaderPin={leaderPin} />
      </GameProvider>
    </ErrorBoundary>
  )
}

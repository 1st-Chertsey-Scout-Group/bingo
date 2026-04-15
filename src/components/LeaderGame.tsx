'use client'

import { useCallback, useEffect } from 'react'
import { Board } from '@/components/Board'
import { Lobby } from '@/components/Lobby'
import { RoundHeader } from '@/components/RoundHeader'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { RoundItem, Team } from '@/types'

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

    socket.on('lobby:joined', handleLobbyJoined)
    socket.on('lobby:teams', handleLobbyTeams)
    socket.on('game:started', handleGameStarted)

    return () => {
      socket.off('lobby:joined', handleLobbyJoined)
      socket.off('lobby:teams', handleLobbyTeams)
      socket.off('game:started', handleGameStarted)
    }
  }, [socket, dispatch, gamePin, leaderPin])

  const handleStartRound = useCallback(() => {
    if (!socket) return
    socket.emit('game:start', {})
  }, [socket])

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      if (!socket) return
      console.log('Leader tapped square:', roundItemId)
    },
    [socket],
  )

  const handleEndRound = useCallback(() => {
    if (!socket) return
    socket.emit('game:end', {})
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

'use client'

import { useCallback, useEffect } from 'react'

import { Board } from '@/components/Board'
import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { RoundItem, Team } from '@/types'

function ScoutGameInner() {
  const socket = useSocket()
  const { state, dispatch } = useGame()

  useEffect(() => {
    if (!socket) return

    let gamePin: string | undefined
    try {
      const session = localStorage.getItem('scout-bingo-session')
      if (session) {
        const parsed = JSON.parse(session) as { gamePin?: string }
        gamePin = parsed.gamePin
      }
    } catch {
      // localStorage unavailable
    }

    if (gamePin) {
      socket.emit('lobby:join', { gamePin })
    }

    const handleLobbyJoined = (payload: {
      teamId: string
      teamName: string
      teamColour: string
    }) => {
      dispatch({
        type: 'LOBBY_JOINED',
        teamId: payload.teamId,
        teamName: payload.teamName,
        teamColour: payload.teamColour,
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
  }, [socket, dispatch])

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      const item = state.board.find((i) => i.roundItemId === roundItemId)
      if (!item) return
      if (item.claimedByTeamId !== null) return
      // Camera capture will be wired in step 097
    },
    [state.board],
  )

  switch (state.status) {
    case 'lobby':
      return <Lobby myTeam={state.myTeam} teams={state.teams} role="scout" />
    case 'active':
      return (
        <div className="flex h-[calc(100dvh)] flex-col">
          <Board
            items={state.board}
            role="scout"
            myTeamId={state.myTeam?.id ?? null}
            onSquareTap={handleSquareTap}
          />
        </div>
      )
    case 'ended':
      return <div>Round over</div>
    default:
      return <div>Loading...</div>
  }
}

export function ScoutGame({ gameId }: { gameId: string }) {
  return (
    <GameProvider>
      <ScoutGameInner />
    </GameProvider>
  )
}

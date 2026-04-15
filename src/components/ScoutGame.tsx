'use client'

import { useEffect } from 'react'

import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { Team } from '@/types'

function ScoutGameInner() {
  const socket = useSocket()
  const { state, dispatch } = useGame()

  useEffect(() => {
    if (!socket) return

    const handleLobbyTeams = ({ teams }: { teams: Team[] }) => {
      dispatch({ type: 'LOBBY_TEAMS', teams })
    }

    socket.on('lobby:teams', handleLobbyTeams)

    return () => {
      socket.off('lobby:teams', handleLobbyTeams)
    }
  }, [socket, dispatch])

  switch (state.status) {
    case 'lobby':
      return <Lobby myTeam={state.myTeam} teams={state.teams} role="scout" />
    case 'active':
      return <div>Game is active - Board goes here</div>
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

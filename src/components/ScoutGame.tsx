'use client'

import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'

function ScoutGameInner() {
  useSocket()
  const { state } = useGame()

  switch (state.status) {
    case 'lobby':
      return <div>Lobby - Waiting for game to start...</div>
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

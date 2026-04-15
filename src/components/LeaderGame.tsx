'use client'

import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'

function LeaderGameInner() {
  const socket = useSocket()
  const { state } = useGame()

  switch (state.status) {
    case 'lobby':
      return <div>Leader Lobby</div>
    case 'active':
      return <div>Leader Board</div>
    case 'ended':
      return <div>Game Summary</div>
    default:
      return <div>Loading...</div>
  }
}

export function LeaderGame({ gameId }: { gameId: string }) {
  return (
    <GameProvider>
      <LeaderGameInner />
    </GameProvider>
  )
}

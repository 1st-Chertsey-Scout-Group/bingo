'use client'

import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'

type LeaderGameInnerProps = {
  gamePin: string
  leaderPin: string
}

function LeaderGameInner({ gamePin, leaderPin }: LeaderGameInnerProps) {
  const socket = useSocket()
  const { state } = useGame()

  switch (state.status) {
    case 'lobby':
      return (
        <Lobby
          role="leader"
          myTeam={null}
          teams={state.teams}
          gamePin={gamePin}
          leaderPin={leaderPin}
        />
      )
    case 'active':
      return <div>Leader Board</div>
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

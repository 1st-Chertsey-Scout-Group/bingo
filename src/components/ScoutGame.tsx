'use client'

import { type ChangeEvent, useCallback, useEffect, useRef } from 'react'

import { Board } from '@/components/Board'
import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import type { RoundItem, Team } from '@/types'

function ScoutGameInner() {
  const socket = useSocket()
  const { state, dispatch } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRoundItemIdRef = useRef<string | null>(null)

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

  const handleFileSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const roundItemId = pendingRoundItemIdRef.current
    e.target.value = ''
    if (!file || !roundItemId) return
    pendingRoundItemIdRef.current = null
    // Compression and upload will be wired in steps 098-100
  }, [])

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      const item = state.board.find((i) => i.roundItemId === roundItemId)
      if (!item) return
      if (item.claimedByTeamId !== null) return
      pendingRoundItemIdRef.current = roundItemId
      fileInputRef.current?.click()
    },
    [state.board],
  )

  switch (state.status) {
    case 'lobby':
      return <Lobby myTeam={state.myTeam} teams={state.teams} role="scout" />
    case 'active':
      return (
        <div className="flex h-[calc(100dvh)] flex-col">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelected}
          />
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

'use client'

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { toast } from 'sonner'

import { Board } from '@/components/Board'
import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import { compressImage } from '@/lib/image'
import type { RoundItem, Team } from '@/types'

function ScoutGameInner({ gameId }: { gameId: string }) {
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

  const handleFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const roundItemId = pendingRoundItemIdRef.current
      e.target.value = ''
      if (!file || !roundItemId) return
      pendingRoundItemIdRef.current = null

      void (async () => {
        let compressed: Blob
        try {
          compressed = await compressImage(file)
        } catch {
          toast('Something went wrong. Try again.')
          return
        }

        try {
          const teamId = state.myTeam?.id
          if (!teamId) return

          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId,
              teamId,
              roundItemId,
              contentType: 'image/webp',
            }),
          })

          if (!res.ok) {
            toast('Upload failed. Try again.')
            return
          }

          const { uploadUrl, photoUrl } = (await res.json()) as {
            uploadUrl: string
            photoUrl: string
          }

          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: compressed,
            headers: { 'Content-Type': 'image/webp' },
          })

          if (!putRes.ok) {
            toast('Upload failed. Try again.')
            return
          }

          socket?.emit('submission:submit', { roundItemId, photoUrl })
          dispatch({ type: 'SUBMISSION_SENT', roundItemId })
          toast('Submitted!')
        } catch {
          toast('Upload failed. Try again.')
        }
      })()
    },
    [gameId, state.myTeam?.id, socket, dispatch],
  )

  const pendingItems = useMemo(
    () =>
      new Set(
        [...state.mySubmissions.entries()]
          .filter(([, status]) => status === 'pending')
          .map(([roundItemId]) => roundItemId),
      ),
    [state.mySubmissions],
  )

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      const item = state.board.find((i) => i.roundItemId === roundItemId)
      if (!item) return
      if (item.claimedByTeamId !== null) return
      if (pendingItems.has(roundItemId)) return
      pendingRoundItemIdRef.current = roundItemId
      fileInputRef.current?.click()
    },
    [state.board, pendingItems],
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
            pendingItems={pendingItems}
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
      <ScoutGameInner gameId={gameId} />
    </GameProvider>
  )
}

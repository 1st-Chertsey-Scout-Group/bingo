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
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import { compressImage } from '@/lib/image'
import {
  clearSession,
  clearTeamIdFromSession,
  loadSession,
  saveSession,
} from '@/lib/session'
import type { RoundItem, Team, TeamSummary } from '@/types'

function ScoutGameInner({ gameId }: { gameId: string }) {
  const socket = useSocket()
  const { state, dispatch } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRoundItemIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const session = loadSession()
    let gamePin: string | undefined

    if (
      session &&
      session.role === 'scout' &&
      'teamId' in session &&
      session.gameId === gameId
    ) {
      // Rejoin with cached session
      gamePin = session.gamePin
      socket.emit('rejoin', {
        gamePin: session.gamePin,
        teamId: session.teamId,
      })
    } else {
      // Normal join flow
      gamePin = session?.gamePin
      if (gamePin) {
        socket.emit('lobby:join', { gamePin })
      }
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
      if (gamePin) {
        saveSession({
          gamePin,
          gameId,
          teamId: payload.teamId,
          teamName: payload.teamName,
          teamColour: payload.teamColour,
          role: 'scout',
        })
      }
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

    const handleSquarePending = (payload: { roundItemId: string }) => {
      dispatch({
        type: 'SQUARE_PENDING',
        roundItemId: payload.roundItemId,
      })
    }

    const handleSubmissionReceived = (_payload: { roundItemId: string }) => {
      toast('Submitted!')
    }

    const handleSubmissionApproved = (payload: { roundItemId: string }) => {
      toast.success('Approved!')
      dispatch({
        type: 'SUBMISSION_RESOLVED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleSubmissionRejected = (payload: { roundItemId: string }) => {
      toast('Rejected — try again!')
      dispatch({
        type: 'SUBMISSION_RESOLVED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleSubmissionDiscarded = (payload: {
      roundItemId: string
      reason: string
    }) => {
      toast('Already claimed!')
      dispatch({
        type: 'SUBMISSION_RESOLVED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleGameEnded = (payload: { summary: TeamSummary[] }) => {
      dispatch({ type: 'GAME_ENDED', summary: payload.summary })
    }

    const handleGameLobby = () => {
      clearTeamIdFromSession()
      dispatch({ type: 'GAME_LOBBY' })
      // Re-join lobby for fresh team assignment
      if (gamePin) {
        socket.emit('lobby:join', { gamePin })
      }
    }

    const handleRejoinError = () => {
      clearSession()
      // Fall back to normal join
      if (gamePin) {
        socket.emit('lobby:join', { gamePin })
      }
    }

    socket.on('lobby:joined', handleLobbyJoined)
    socket.on('lobby:teams', handleLobbyTeams)
    socket.on('game:started', handleGameStarted)
    socket.on('square:claimed', handleSquareClaimed)
    socket.on('square:pending', handleSquarePending)
    socket.on('submission:received', handleSubmissionReceived)
    socket.on('submission:approved', handleSubmissionApproved)
    socket.on('submission:rejected', handleSubmissionRejected)
    socket.on('submission:discarded', handleSubmissionDiscarded)
    socket.on('game:ended', handleGameEnded)
    socket.on('game:lobby', handleGameLobby)
    socket.on('rejoin:error', handleRejoinError)

    return () => {
      socket.off('lobby:joined', handleLobbyJoined)
      socket.off('lobby:teams', handleLobbyTeams)
      socket.off('game:started', handleGameStarted)
      socket.off('square:claimed', handleSquareClaimed)
      socket.off('square:pending', handleSquarePending)
      socket.off('submission:received', handleSubmissionReceived)
      socket.off('submission:approved', handleSubmissionApproved)
      socket.off('submission:rejected', handleSubmissionRejected)
      socket.off('submission:discarded', handleSubmissionDiscarded)
      socket.off('game:ended', handleGameEnded)
      socket.off('game:lobby', handleGameLobby)
      socket.off('rejoin:error', handleRejoinError)
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
    case 'ended': {
      const myScore =
        state.summary?.find((t) => t.teamId === state.myTeam?.id)
          ?.claimedCount ?? 0
      return (
        <div className="relative flex h-[calc(100dvh)] flex-col">
          <Board
            items={state.board}
            role="scout"
            myTeamId={state.myTeam?.id ?? null}
            onSquareTap={() => {}}
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60">
            <h1 className="mb-4 text-center text-3xl font-bold text-white">
              Head back to base!
            </h1>
            <p className="text-center text-lg text-white/90">
              Your team claimed {myScore} {myScore === 1 ? 'square' : 'squares'}
            </p>
          </div>
        </div>
      )
    }
    default:
      return <div>Loading...</div>
  }
}

export function ScoutGame({ gameId }: { gameId: string }) {
  return (
    <GameProvider>
      <ConnectionBanner />
      <ScoutGameInner gameId={gameId} />
    </GameProvider>
  )
}

'use client'

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

import { Board } from '@/components/Board'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { Lobby } from '@/components/Lobby'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useSocket } from '@/hooks/useSocket'
import { compressImage } from '@/lib/image'
import { uploadWithRetry } from '@/lib/upload'
import {
  clearSession,
  clearTeamIdFromSession,
  loadSession,
  saveSession,
} from '@/lib/session'
import type {
  GameState,
  RoundItem,
  SubmissionStatus,
  Team,
  TeamSummary,
} from '@/types'

function ScoutGameInner({ gameId }: { gameId: string }) {
  const socket = useSocket()
  const { state, dispatch } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRoundItemIdRef = useRef<string | null>(null)
  const [failedUpload, setFailedUpload] = useState<{
    roundItemId: string
    blob: Blob
  } | null>(null)

  useEffect(() => {
    if (!socket) return

    const session = loadSession()
    let gamePin: string | undefined

    if (
      session &&
      session.role === 'scout' &&
      'teamId' in session &&
      'sessionToken' in session &&
      session.gameId === gameId
    ) {
      // Rejoin with cached session
      gamePin = session.gamePin
      socket.emit('rejoin', {
        gamePin: session.gamePin,
        teamId: session.teamId,
        sessionToken: session.sessionToken,
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
      sessionToken: string
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
          sessionToken: payload.sessionToken,
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

    const handleRejoinState = (
      payload: Omit<GameState, 'mySubmissions'> & {
        mySubmissions: Array<[string, string]>
      },
    ) => {
      const state: GameState = {
        ...payload,
        mySubmissions: new Map(
          payload.mySubmissions.map(([k, v]) => [k, v as SubmissionStatus]),
        ),
      }
      dispatch({ type: 'FULL_STATE', state })
    }

    const handleRejoinError = (payload: { message: string }) => {
      clearSession()
      toast(payload.message)
      window.location.href = '/'
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
    socket.on('rejoin:state', handleRejoinState)
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
      socket.off('rejoin:state', handleRejoinState)
      socket.off('rejoin:error', handleRejoinError)
    }
  }, [socket, dispatch])

  const doUpload = useCallback(
    async (blob: Blob, roundItemId: string) => {
      const teamId = state.myTeam?.id
      if (!teamId) return

      const session = loadSession()
      const sessionToken =
        session && session.role === 'scout' ? session.sessionToken : null
      if (!sessionToken) return

      const getPresignedUrl = async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            teamId,
            roundItemId,
            contentType: 'image/webp',
            sessionToken,
          }),
        })
        if (!res.ok) throw new Error('Failed to get upload URL')
        return (await res.json()) as { uploadUrl: string; photoUrl: string }
      }

      const result = await uploadWithRetry(blob, getPresignedUrl)

      if (result.success) {
        setFailedUpload(null)
        socket?.emit('submission:submit', {
          roundItemId,
          photoUrl: result.photoUrl,
        })
        dispatch({ type: 'SUBMISSION_SENT', roundItemId })
      } else {
        setFailedUpload({ roundItemId, blob: result.blob })
      }
    },
    [gameId, state.myTeam?.id, socket, dispatch],
  )

  const handleFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const roundItemId = pendingRoundItemIdRef.current
      e.target.value = ''
      if (!file || !roundItemId) return
      pendingRoundItemIdRef.current = null

      // Clear any previous failed upload
      setFailedUpload(null)

      void (async () => {
        let compressed: Blob
        try {
          compressed = await compressImage(file)
        } catch {
          toast('Something went wrong. Try again.')
          return
        }

        await doUpload(compressed, roundItemId)
      })()
    },
    [doUpload],
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
      // Retry failed upload
      if (failedUpload && failedUpload.roundItemId === roundItemId) {
        setFailedUpload(null)
        void doUpload(failedUpload.blob, roundItemId)
        return
      }

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
            failedItemId={failedUpload?.roundItemId ?? null}
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

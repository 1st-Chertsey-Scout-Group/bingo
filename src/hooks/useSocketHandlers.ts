'use client'

import { useEffect, type Dispatch } from 'react'
import type { Socket } from 'socket.io-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketHandler = (...args: any[]) => void
export type SocketHandlerMap = Record<string, SocketHandler>

import type {
  GameAction,
  GameState,
  RoundItem,
  SubmissionStatus,
  Team,
  TeamSummary,
} from '@/types'

export function useSocketHandlers(
  socket: Socket | null,
  handlers: SocketHandlerMap,
): void {
  useEffect(() => {
    if (!socket) return

    const entries = Object.entries(handlers)
    for (const [event, handler] of entries) {
      socket.on(event, handler)
    }

    return () => {
      for (const [event, handler] of entries) {
        socket.off(event, handler)
      }
    }
  }, [socket, handlers])
}

export function buildCommonHandlers(dispatch: Dispatch<GameAction>) {
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

  const handleGameEnded = (payload: { summary: TeamSummary[] }) => {
    dispatch({ type: 'GAME_ENDED', summary: payload.summary })
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

  return {
    'lobby:teams': handleLobbyTeams,
    'game:started': handleGameStarted,
    'square:claimed': handleSquareClaimed,
    'square:pending': handleSquarePending,
    'game:ended': handleGameEnded,
    'rejoin:state': handleRejoinState,
  }
}

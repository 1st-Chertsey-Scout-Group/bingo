'use client'

import { useEffect, type Dispatch } from 'react'
import type { Socket } from 'socket.io-client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketHandler = (...args: any[]) => void
export type SocketHandlerMap = Record<string, SocketHandler>

import type { AddLogEntry } from '@/hooks/useActivityLog'
import { LOG_CATEGORY } from '@/types'
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

export function buildCommonHandlers(
  dispatch: Dispatch<GameAction>,
  addLogEntry?: AddLogEntry,
) {
  const handleLobbyTeams = ({ teams }: { teams: Team[] }) => {
    dispatch({ type: 'LOBBY_TEAMS', teams })
    addLogEntry?.({
      category: LOG_CATEGORY.CONNECTION,
      teamName: null,
      teamColour: null,
      message: `Teams updated (${teams.length} ${teams.length === 1 ? 'team' : 'teams'})`,
    })
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
    addLogEntry?.({
      category: LOG_CATEGORY.GAME_STATE,
      teamName: null,
      teamColour: null,
      message: `Round started with ${payload.board.length} squares`,
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
    addLogEntry?.({
      category: LOG_CATEGORY.SUBMISSION,
      teamName: payload.teamName,
      teamColour: payload.teamColour,
      message: 'claimed a square',
    })
  }

  const handleSquarePending = (payload: { roundItemId: string }) => {
    dispatch({
      type: 'SQUARE_PENDING',
      roundItemId: payload.roundItemId,
    })
    addLogEntry?.({
      category: LOG_CATEGORY.SUBMISSION,
      teamName: null,
      teamColour: null,
      message: 'new pending submission',
    })
  }

  const handleGameEnded = (payload: { summary: TeamSummary[] }) => {
    dispatch({ type: 'GAME_ENDED', summary: payload.summary })
    addLogEntry?.({
      category: LOG_CATEGORY.GAME_STATE,
      teamName: null,
      teamColour: null,
      message: 'Round ended',
    })
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

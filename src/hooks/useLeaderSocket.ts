'use client'

import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'

import { buildCommonHandlers } from '@/hooks/useSocketHandlers'
import {
  clearSession,
  clearTeamIdFromSession,
  loadSession,
} from '@/lib/session'
import type { BoardItem, GameAction, SubmissionForReview } from '@/types'

export function useLeaderSocket(
  socket: Socket | null,
  dispatch: Dispatch<GameAction>,
  gamePin: string,
  leaderPin: string,
): void {
  useEffect(() => {
    if (!socket) return

    const session = loadSession()
    let leaderName: string | undefined

    if (
      session &&
      session.role === 'leader' &&
      'leaderName' in session &&
      session.gamePin === gamePin
    ) {
      leaderName = session.leaderName
      socket.emit('rejoin', {
        gamePin: session.gamePin,
        leaderPin: session.leaderPin,
        leaderName: session.leaderName,
      })
    } else {
      // Only reuse leaderName from a session that matches this game
      const staleSession = loadSession()
      if (
        staleSession &&
        staleSession.role === 'leader' &&
        staleSession.gamePin === gamePin
      ) {
        leaderName = staleSession.leaderName
      }
      if (leaderName) {
        socket.emit('lobby:join', { gamePin, leaderPin, leaderName })
      }
    }

    const handleLobbyJoined = (payload: {
      gameId: string
      leaderName: string
    }) => {
      dispatch({
        type: 'LOBBY_JOINED',
        teamId: '',
        teamName: payload.leaderName,
        teamColour: '',
      })
    }

    const common = buildCommonHandlers(dispatch)

    const handleReviewSubmission = (payload: SubmissionForReview) => {
      dispatch({
        type: 'REVIEW_PROMOTED',
        roundItemId: payload.roundItemId,
        submission: payload,
      })
    }

    const handleSquareLocked = (payload: {
      roundItemId: string
      leaderName: string
    }) => {
      dispatch({
        type: 'SQUARE_LOCKED',
        roundItemId: payload.roundItemId,
        leaderName: payload.leaderName,
      })
    }

    const handleSquareUnlocked = (payload: {
      roundItemId: string
      hasPendingSubmissions: boolean
    }) => {
      dispatch({
        type: 'SQUARE_UNLOCKED',
        roundItemId: payload.roundItemId,
        hasPendingSubmissions: payload.hasPendingSubmissions,
      })
    }

    const handleGameLobby = () => {
      clearTeamIdFromSession()
      dispatch({ type: 'GAME_LOBBY' })
      // Re-join lobby
      if (leaderName) {
        socket.emit('lobby:join', { gamePin, leaderPin, leaderName })
      }
    }

    const handleRejoinError = (payload: { message: string }) => {
      const message = payload.message
      const fatal = new Set([
        'Game not found',
        'Game has ended',
        'Invalid leader PIN',
      ])

      if (fatal.has(message)) {
        clearSession()
        toast(message)
        window.location.href = '/'
        return
      }

      // Transient errors (e.g. "Name already taken" during reconnect) — just toast
      toast(message)
    }

    const handleTeamsLocked = (payload: { locked: boolean }) => {
      dispatch({ type: 'TEAMS_LOCKED', locked: payload.locked })
    }

    const handleServerError = (payload: { message?: string } | undefined) => {
      const raw = payload?.message ?? 'Something went wrong'
      const friendly: Record<string, string> = {
        'Game is not active': 'The round has ended',
        'Square already claimed': 'Another leader already approved this square',
        'No pending submissions': 'No photos to review for this square',
        'You do not hold the lock': 'Another leader is reviewing this square',
        'Submission not found': 'This submission is no longer available',
        'Submission is no longer pending':
          'This submission was already reviewed',
      }
      toast(friendly[raw] ?? raw)
    }

    const handleBoardPreview = (payload: { board: BoardItem[] }) => {
      dispatch({ type: 'BOARD_PREVIEW', board: payload.board })
    }

    const handleBoardRefreshItem = (payload: {
      index: number
      item: BoardItem
    }) => {
      dispatch({
        type: 'BOARD_PREVIEW_REFRESH',
        index: payload.index,
        item: payload.item,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: Record<string, (...args: any[]) => void> = {
      ...common,
      error: handleServerError,
      'lobby:joined': handleLobbyJoined,
      'review:submission': handleReviewSubmission,
      'square:locked': handleSquareLocked,
      'square:unlocked': handleSquareUnlocked,
      'game:lobby': handleGameLobby,
      'rejoin:error': handleRejoinError,
      'team:locked': handleTeamsLocked,
      'board:preview': handleBoardPreview,
      'board:refresh-item': handleBoardRefreshItem,
    }

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler)
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event, handler)
      }
    }
  }, [socket, dispatch, gamePin, leaderPin])
}

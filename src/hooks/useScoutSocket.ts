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
  saveSession,
} from '@/lib/session'
import type { GameAction } from '@/types'

export function useScoutSocket(
  socket: Socket | null,
  dispatch: Dispatch<GameAction>,
  gameId: string,
): void {
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
      teamsLocked?: boolean
    }) => {
      dispatch({
        type: 'LOBBY_JOINED',
        teamId: payload.teamId,
        teamName: payload.teamName,
        teamColour: payload.teamColour,
      })
      if (payload.teamsLocked !== undefined) {
        dispatch({ type: 'TEAMS_LOCKED', locked: payload.teamsLocked })
      }
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

    const common = buildCommonHandlers(dispatch)

    const handleSubmissionReceived = () => {
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
      toast.error('Rejected — try again!')
      dispatch({
        type: 'SUBMISSION_RESOLVED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleSubmissionDiscarded = (payload: {
      roundItemId: string
      reason: string
    }) => {
      toast.error('Already claimed!')
      dispatch({
        type: 'SUBMISSION_RESOLVED',
        roundItemId: payload.roundItemId,
      })
    }

    const handleGameLobby = () => {
      clearSession()
      dispatch({ type: 'GAME_LOBBY' })
      if (gamePin) {
        const delayMs = Math.floor(Math.random() * 500)
        setTimeout(() => {
          socket.emit('lobby:join', { gamePin })
        }, delayMs)
      }
    }

    const handleRejoinError = (payload: { message: string }) => {
      const message = payload.message
      const fatal = new Set([
        'Invalid leader PIN',
        'Game not found',
        'Game has ended',
        'Invalid session token',
      ])
      const recoverable = new Set([
        'Round has ended — please rejoin',
        'Team not in current round',
        'Team not found',
      ])

      if (fatal.has(message)) {
        clearSession()
        toast.error(message)
        window.location.href = '/'
        return
      }

      if (recoverable.has(message) && gamePin) {
        clearTeamIdFromSession()
        toast.error(message)
        socket.emit('lobby:join', { gamePin })
        return
      }

      toast.error(message)
    }

    const handleTeamSwitched = (payload: {
      teamId: string
      teamName: string
      teamColour: string
      sessionToken: string
    }) => {
      dispatch({
        type: 'TEAM_SWITCHED',
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

    const handleTeamsLocked = (payload: { locked: boolean }) => {
      dispatch({ type: 'TEAMS_LOCKED', locked: payload.locked })
    }

    const handleServerError = (payload: { message?: string } | undefined) => {
      const raw = payload?.message ?? 'Something went wrong'
      const friendly: Record<string, string> = {
        'Game is not active':
          'The round has ended — your photo was not submitted',
        'Invalid round item': 'That square is no longer on the board',
        'Invalid team': 'Your team was not found — try refreshing',
        'Team session is not yours':
          'Your session expired — try refreshing the page',
        'Invalid photo URL': 'Photo upload failed — please try again',
        'No more teams available':
          'All teams are taken — ask a leader for help',
        'You already have a pending submission for this square':
          'Already submitted — waiting for a leader to review',
      }
      toast.error(friendly[raw] ?? raw)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: Record<string, (...args: any[]) => void> = {
      ...common,
      error: handleServerError,
      'lobby:joined': handleLobbyJoined,
      'team:switched': handleTeamSwitched,
      'team:locked': handleTeamsLocked,
      'submission:received': handleSubmissionReceived,
      'submission:approved': handleSubmissionApproved,
      'submission:rejected': handleSubmissionRejected,
      'submission:discarded': handleSubmissionDiscarded,
      'game:lobby': handleGameLobby,
      'rejoin:error': handleRejoinError,
    }

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler)
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event, handler)
      }
    }
  }, [socket, dispatch, gameId])
}

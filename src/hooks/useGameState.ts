'use client'

import { useReducer } from 'react'

import type { GameAction, GameState } from '@/types'

const initialState: GameState = {
  status: 'lobby',
  teams: [],
  board: [],
  myTeam: null,
  mySubmissions: new Map(),
  summary: null,
  roundStartedAt: null,
  locks: new Map(),
  reviewingRoundItemId: null,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GAME_STARTED':
      return {
        ...state,
        status: 'active',
        board: action.items,
        roundStartedAt: action.roundStartedAt,
        mySubmissions: new Map(),
        locks: new Map(),
      }

    case 'SQUARE_CLAIMED':
      return {
        ...state,
        board: state.board.map((item) =>
          item.id === action.roundItemId
            ? {
                ...item,
                status: 'claimed' as const,
                claimedByTeamId: action.teamId,
                claimedByTeamName: action.teamName,
                claimedByTeamColour: action.teamColour,
              }
            : item,
        ),
      }

    case 'SQUARE_PENDING':
      return {
        ...state,
        board: state.board.map((item) =>
          item.id === action.roundItemId
            ? { ...item, status: 'pending' as const }
            : item,
        ),
      }

    case 'SQUARE_LOCKED': {
      const newLocks = new Map(state.locks)
      newLocks.set(action.roundItemId, action.leaderName)
      return { ...state, locks: newLocks }
    }

    case 'SQUARE_UNLOCKED': {
      const newLocks = new Map(state.locks)
      newLocks.delete(action.roundItemId)
      return { ...state, locks: newLocks }
    }

    case 'SUBMISSION_RECEIVED': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.itemId, 'pending')
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'SUBMISSION_APPROVED': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.itemId, 'approved')
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'SUBMISSION_REJECTED': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.itemId, 'rejected')
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'SUBMISSION_DISCARDED': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.itemId, 'discarded')
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'REVIEW_PROMOTED':
      return {
        ...state,
        reviewingRoundItemId: action.roundItemId,
      }

    case 'GAME_ENDED':
      return {
        ...state,
        status: 'ended',
        summary: action.summary,
      }

    case 'GAME_LOBBY':
      return {
        ...initialState,
        teams: state.teams,
      }

    case 'LOBBY_TEAMS':
      return {
        ...state,
        teams: action.teams,
      }

    case 'FULL_STATE':
      return action.state
  }
}

export function useGameState() {
  return useReducer(gameReducer, initialState)
}

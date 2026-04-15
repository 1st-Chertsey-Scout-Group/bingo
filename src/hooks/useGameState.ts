'use client'

import React, { createContext, useContext, useReducer } from 'react'

import type { GameAction, GameState } from '@/types'

const initialState: GameState = {
  status: 'lobby',
  teams: [],
  board: [],
  myTeam: null,
  mySubmissions: new Map(),
  summary: null,
  roundStartedAt: null,
  reviewingRoundItemId: null,
  currentSubmission: null,
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
      }

    case 'SQUARE_CLAIMED': {
      const updatedSubmissions = new Map(state.mySubmissions)
      updatedSubmissions.delete(action.roundItemId)
      return {
        ...state,
        board: state.board.map((item) =>
          item.roundItemId === action.roundItemId
            ? {
                ...item,
                hasPendingSubmissions: false,
                claimedByTeamId: action.teamId,
                claimedByTeamName: action.teamName,
                claimedByTeamColour: action.teamColour,
              }
            : item,
        ),
        mySubmissions: updatedSubmissions,
      }
    }

    case 'SQUARE_PENDING':
      return {
        ...state,
        board: state.board.map((item) =>
          item.roundItemId === action.roundItemId
            ? { ...item, hasPendingSubmissions: true }
            : item,
        ),
      }

    case 'SQUARE_LOCKED':
      return {
        ...state,
        board: state.board.map((item) =>
          item.roundItemId === action.roundItemId
            ? { ...item, lockedByLeader: action.leaderName }
            : item,
        ),
      }

    case 'SQUARE_UNLOCKED':
      return {
        ...state,
        board: state.board.map((item) =>
          item.roundItemId === action.roundItemId
            ? { ...item, lockedByLeader: null }
            : item,
        ),
      }

    case 'SUBMISSION_SENT': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.roundItemId, 'pending')
      return { ...state, mySubmissions: newSubmissions }
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

    case 'SUBMISSION_RESOLVED': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.delete(action.roundItemId)
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'REVIEW_PROMOTED':
      return {
        ...state,
        reviewingRoundItemId: action.roundItemId,
        currentSubmission: action.submission,
      }

    case 'REVIEW_CLOSED':
      return {
        ...state,
        reviewingRoundItemId: null,
        currentSubmission: null,
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

    case 'LOBBY_JOINED':
      return {
        ...state,
        myTeam: {
          id: action.teamId,
          name: action.teamName,
          colour: action.teamColour,
        },
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

type GameContextValue = {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useGameState()

  return React.createElement(
    GameContext.Provider,
    { value: { state, dispatch } },
    children,
  )
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

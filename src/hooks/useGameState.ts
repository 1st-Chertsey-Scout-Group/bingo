'use client'

import React, { createContext, useContext, useReducer } from 'react'

import { GAME_STATUS, SUBMISSION_STATUS } from '@/lib/constants'
import type { GameAction, GameState } from '@/types'

const initialState: GameState = {
  status: GAME_STATUS.LOBBY,
  teams: [],
  board: [],
  myTeam: null,
  mySubmissions: new Map(),
  summary: null,
  roundStartedAt: null,
  reviewingRoundItemId: null,
  currentSubmission: null,
  previewBoard: null,
  teamsLocked: false,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GAME_STARTED':
      return {
        ...state,
        status: GAME_STATUS.ACTIVE,
        board: action.items,
        roundStartedAt: action.roundStartedAt,
        mySubmissions: new Map(),
        previewBoard: null,
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

    case 'SQUARE_UNLOCKED': {
      const clearReview = state.reviewingRoundItemId === action.roundItemId
      return {
        ...state,
        board: state.board.map((item) =>
          item.roundItemId === action.roundItemId
            ? {
                ...item,
                lockedByLeader: null,
                hasPendingSubmissions: action.hasPendingSubmissions,
              }
            : item,
        ),
        reviewingRoundItemId: clearReview ? null : state.reviewingRoundItemId,
        currentSubmission: clearReview ? null : state.currentSubmission,
      }
    }

    case 'SUBMISSION_SENT': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.roundItemId, SUBMISSION_STATUS.PENDING)
      return { ...state, mySubmissions: newSubmissions }
    }

    case 'SET_SUBMISSION_STATUS': {
      const newSubmissions = new Map(state.mySubmissions)
      newSubmissions.set(action.roundItemId, action.status)
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
        status: GAME_STATUS.ENDED,
        summary: action.summary,
      }

    case 'GAME_LOBBY':
      return { ...initialState }

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

    case 'BOARD_PREVIEW':
      return { ...state, previewBoard: action.board }

    case 'BOARD_PREVIEW_REFRESH': {
      if (!state.previewBoard) return state
      const updated = [...state.previewBoard]
      updated[action.index] = action.item
      return { ...state, previewBoard: updated }
    }

    case 'BOARD_PREVIEW_CLEAR':
      return { ...state, previewBoard: null }

    case 'TEAM_SWITCHED':
      return {
        ...state,
        myTeam: {
          id: action.teamId,
          name: action.teamName,
          colour: action.teamColour,
        },
      }

    case 'TEAMS_LOCKED':
      return { ...state, teamsLocked: action.locked }
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

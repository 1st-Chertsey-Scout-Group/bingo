import { describe, it, expect } from 'vitest'
import { gameReducer } from '@/hooks/useGameState'
import { GAME_STATUS, SUBMISSION_STATUS } from '@/lib/constants'
import type { GameState, RoundItem } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
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
    ...overrides,
  }
}

function makeRoundItem(overrides: Partial<RoundItem> = {}): RoundItem {
  return {
    roundItemId: 'ri-1',
    displayName: 'Oak Tree',
    claimedByTeamId: null,
    claimedByTeamName: null,
    claimedByTeamColour: null,
    hasPendingSubmissions: false,
    lockedByLeader: null,
    ...overrides,
  }
}

describe('gameReducer', () => {
  describe('GAME_STARTED', () => {
    it('sets status to active and populates board', () => {
      const items = [makeRoundItem()]
      const result = gameReducer(makeState(), {
        type: 'GAME_STARTED',
        items,
        roundStartedAt: '2026-01-01T00:00:00Z',
      })
      expect(result.status).toBe(GAME_STATUS.ACTIVE)
      expect(result.board).toBe(items)
      expect(result.roundStartedAt).toBe('2026-01-01T00:00:00Z')
      expect(result.mySubmissions.size).toBe(0)
      expect(result.previewBoard).toBeNull()
    })
  })

  describe('SQUARE_CLAIMED', () => {
    it('updates the correct board item with team info', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1' }),
        makeRoundItem({ roundItemId: 'ri-2' }),
      ]
      const subs = new Map([['ri-1', SUBMISSION_STATUS.PENDING as const]])
      const state = makeState({ board, mySubmissions: subs })

      const result = gameReducer(state, {
        type: 'SQUARE_CLAIMED',
        roundItemId: 'ri-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
      })

      expect(result.board[0].claimedByTeamId).toBe('t-1')
      expect(result.board[0].claimedByTeamName).toBe('Foxes')
      expect(result.board[0].claimedByTeamColour).toBe('#ff0000')
      expect(result.board[0].hasPendingSubmissions).toBe(false)
      expect(result.mySubmissions.has('ri-1')).toBe(false)
    })

    it('leaves other board items untouched', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1' }),
        makeRoundItem({ roundItemId: 'ri-2' }),
      ]
      const state = makeState({ board })

      const result = gameReducer(state, {
        type: 'SQUARE_CLAIMED',
        roundItemId: 'ri-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
      })

      expect(result.board[1].claimedByTeamId).toBeNull()
    })
  })

  describe('SQUARE_PENDING', () => {
    it('sets hasPendingSubmissions on matching item', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1' }),
        makeRoundItem({ roundItemId: 'ri-2' }),
      ]
      const state = makeState({ board })

      const result = gameReducer(state, {
        type: 'SQUARE_PENDING',
        roundItemId: 'ri-1',
      })

      expect(result.board[0].hasPendingSubmissions).toBe(true)
      expect(result.board[1].hasPendingSubmissions).toBe(false)
    })
  })

  describe('SQUARE_LOCKED', () => {
    it('sets lockedByLeader on matching item', () => {
      const board = [makeRoundItem({ roundItemId: 'ri-1' })]
      const state = makeState({ board })

      const result = gameReducer(state, {
        type: 'SQUARE_LOCKED',
        roundItemId: 'ri-1',
        leaderName: 'Alice',
      })

      expect(result.board[0].lockedByLeader).toBe('Alice')
    })
  })

  describe('SQUARE_UNLOCKED', () => {
    it('clears lock and sets hasPendingSubmissions from action', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1', lockedByLeader: 'Alice' }),
      ]
      const state = makeState({ board })

      const result = gameReducer(state, {
        type: 'SQUARE_UNLOCKED',
        roundItemId: 'ri-1',
        hasPendingSubmissions: false,
      })

      expect(result.board[0].lockedByLeader).toBeNull()
      expect(result.board[0].hasPendingSubmissions).toBe(false)
    })

    it('clears reviewingRoundItemId when the unlocked item is being reviewed', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1', lockedByLeader: 'Alice' }),
      ]
      const state = makeState({
        board,
        reviewingRoundItemId: 'ri-1',
        currentSubmission: {
          submissionId: 's-1',
          roundItemId: 'ri-1',
          displayName: 'Oak',
          photoUrl: 'http://example.com/photo.jpg',
          teamId: 't-1',
          teamName: 'Foxes',
          teamColour: '#ff0000',
        },
      })

      const result = gameReducer(state, {
        type: 'SQUARE_UNLOCKED',
        roundItemId: 'ri-1',
        hasPendingSubmissions: false,
      })

      expect(result.reviewingRoundItemId).toBeNull()
      expect(result.currentSubmission).toBeNull()
    })

    it('does not clear reviewingRoundItemId when a different item is unlocked', () => {
      const board = [
        makeRoundItem({ roundItemId: 'ri-1', lockedByLeader: 'Alice' }),
        makeRoundItem({ roundItemId: 'ri-2', lockedByLeader: 'Bob' }),
      ]
      const state = makeState({ board, reviewingRoundItemId: 'ri-1' })

      const result = gameReducer(state, {
        type: 'SQUARE_UNLOCKED',
        roundItemId: 'ri-2',
        hasPendingSubmissions: false,
      })

      expect(result.reviewingRoundItemId).toBe('ri-1')
    })
  })

  describe('SUBMISSION_SENT', () => {
    it('adds roundItemId to mySubmissions with PENDING status', () => {
      const state = makeState()
      const result = gameReducer(state, {
        type: 'SUBMISSION_SENT',
        roundItemId: 'ri-1',
      })

      expect(result.mySubmissions.get('ri-1')).toBe(SUBMISSION_STATUS.PENDING)
    })
  })

  describe('SET_SUBMISSION_STATUS', () => {
    it('updates the status for a given roundItemId', () => {
      const subs = new Map([['ri-1', SUBMISSION_STATUS.PENDING as const]])
      const state = makeState({ mySubmissions: subs })

      const result = gameReducer(state, {
        type: 'SET_SUBMISSION_STATUS',
        roundItemId: 'ri-1',
        status: SUBMISSION_STATUS.APPROVED,
      })

      expect(result.mySubmissions.get('ri-1')).toBe(SUBMISSION_STATUS.APPROVED)
    })
  })

  describe('SUBMISSION_RESOLVED', () => {
    it('removes roundItemId from mySubmissions', () => {
      const subs = new Map([['ri-1', SUBMISSION_STATUS.PENDING as const]])
      const state = makeState({ mySubmissions: subs })

      const result = gameReducer(state, {
        type: 'SUBMISSION_RESOLVED',
        roundItemId: 'ri-1',
      })

      expect(result.mySubmissions.has('ri-1')).toBe(false)
    })
  })

  describe('REVIEW_PROMOTED', () => {
    it('sets reviewingRoundItemId and currentSubmission', () => {
      const submission = {
        submissionId: 's-1',
        roundItemId: 'ri-1',
        displayName: 'Oak',
        photoUrl: 'http://example.com/photo.jpg',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
      }
      const state = makeState()

      const result = gameReducer(state, {
        type: 'REVIEW_PROMOTED',
        roundItemId: 'ri-1',
        submission,
      })

      expect(result.reviewingRoundItemId).toBe('ri-1')
      expect(result.currentSubmission).toBe(submission)
    })
  })

  describe('REVIEW_CLOSED', () => {
    it('clears reviewingRoundItemId and currentSubmission', () => {
      const state = makeState({ reviewingRoundItemId: 'ri-1' })
      const result = gameReducer(state, { type: 'REVIEW_CLOSED' })

      expect(result.reviewingRoundItemId).toBeNull()
      expect(result.currentSubmission).toBeNull()
    })
  })

  describe('GAME_ENDED', () => {
    it('sets status to ended and stores summary', () => {
      const summary = [
        {
          teamId: 't-1',
          teamName: 'Foxes',
          teamColour: '#ff0000',
          claimedCount: 5,
        },
      ]
      const state = makeState({ status: GAME_STATUS.ACTIVE })

      const result = gameReducer(state, { type: 'GAME_ENDED', summary })

      expect(result.status).toBe(GAME_STATUS.ENDED)
      expect(result.summary).toBe(summary)
    })
  })

  describe('GAME_LOBBY', () => {
    it('resets to initial state', () => {
      const state = makeState({
        status: GAME_STATUS.ACTIVE,
        myTeam: { id: 't-1', name: 'Foxes', colour: '#ff0000' },
        board: [makeRoundItem()],
      })

      const result = gameReducer(state, { type: 'GAME_LOBBY' })

      expect(result.status).toBe(GAME_STATUS.LOBBY)
      expect(result.board).toEqual([])
      expect(result.myTeam).toBeNull()
      expect(result.mySubmissions.size).toBe(0)
    })
  })

  describe('LOBBY_JOINED', () => {
    it('sets myTeam', () => {
      const state = makeState()
      const result = gameReducer(state, {
        type: 'LOBBY_JOINED',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
      })

      expect(result.myTeam).toEqual({
        id: 't-1',
        name: 'Foxes',
        colour: '#ff0000',
      })
    })
  })

  describe('LOBBY_TEAMS', () => {
    it('sets teams array', () => {
      const teams = [{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]
      const state = makeState()
      const result = gameReducer(state, { type: 'LOBBY_TEAMS', teams })

      expect(result.teams).toBe(teams)
    })
  })

  describe('FULL_STATE', () => {
    it('replaces entire state', () => {
      const newState = makeState({ status: GAME_STATUS.ACTIVE })
      const result = gameReducer(makeState(), {
        type: 'FULL_STATE',
        state: newState,
      })

      expect(result).toBe(newState)
    })
  })

  describe('BOARD_PREVIEW', () => {
    it('sets previewBoard', () => {
      const board = [{ itemId: 'i-1', displayName: 'Oak' }]
      const result = gameReducer(makeState(), { type: 'BOARD_PREVIEW', board })

      expect(result.previewBoard).toBe(board)
    })
  })

  describe('BOARD_PREVIEW_REFRESH', () => {
    it('replaces item at given index', () => {
      const board = [
        { itemId: 'i-1', displayName: 'Oak' },
        { itemId: 'i-2', displayName: 'Elm' },
      ]
      const state = makeState({ previewBoard: board })
      const newItem = { itemId: 'i-3', displayName: 'Birch' }

      const result = gameReducer(state, {
        type: 'BOARD_PREVIEW_REFRESH',
        index: 1,
        item: newItem,
      })

      expect(result.previewBoard?.[1]).toBe(newItem)
      expect(result.previewBoard?.[0]).toBe(board[0])
    })

    it('returns state unchanged when previewBoard is null', () => {
      const state = makeState({ previewBoard: null })
      const result = gameReducer(state, {
        type: 'BOARD_PREVIEW_REFRESH',
        index: 0,
        item: { itemId: 'i-1', displayName: 'Oak' },
      })

      expect(result).toBe(state)
    })
  })

  describe('BOARD_PREVIEW_CLEAR', () => {
    it('sets previewBoard to null', () => {
      const state = makeState({
        previewBoard: [{ itemId: 'i-1', displayName: 'Oak' }],
      })
      const result = gameReducer(state, { type: 'BOARD_PREVIEW_CLEAR' })

      expect(result.previewBoard).toBeNull()
    })
  })

  describe('TEAM_SWITCHED', () => {
    it('updates myTeam', () => {
      const state = makeState({
        myTeam: { id: 't-1', name: 'Foxes', colour: '#ff0000' },
      })
      const result = gameReducer(state, {
        type: 'TEAM_SWITCHED',
        teamId: 't-2',
        teamName: 'Hawks',
        teamColour: '#0000ff',
      })

      expect(result.myTeam).toEqual({
        id: 't-2',
        name: 'Hawks',
        colour: '#0000ff',
      })
    })
  })

  describe('TEAMS_LOCKED', () => {
    it('sets teamsLocked', () => {
      const state = makeState({ teamsLocked: false })
      const result = gameReducer(state, { type: 'TEAMS_LOCKED', locked: true })

      expect(result.teamsLocked).toBe(true)
    })
  })

  describe('default', () => {
    it('returns state unchanged for unknown action type', () => {
      const state = makeState()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = gameReducer(state, { type: 'UNKNOWN_ACTION' } as any)

      expect(result).toBe(state)
    })
  })
})

export type Team = {
  id: string
  name: string
  colour: string
}

export type RoundItem = {
  roundItemId: string
  displayName: string
  claimedByTeamId: string | null
  claimedByTeamName: string | null
  claimedByTeamColour: string | null
  hasPendingSubmissions: boolean
  lockedByLeader: string | null
}

import type { GameStatus, SubmissionStatus } from '@/lib/constants'

export type { GameStatus, SubmissionStatus }

export type TeamSummary = {
  teamId: string
  teamName: string
  teamColour: string
  claimedCount: number
}

export type SubmissionForReview = {
  submissionId: string
  roundItemId: string
  displayName: string
  photoUrl: string
  teamId: string
  teamName: string
  teamColour: string
}

export type BoardItem = {
  itemId: string
  displayName: string
}

export type TeamPosition = {
  teamId: string
  teamName: string
  teamColour: string
  lat: number
  lng: number
  accuracy: number
  updatedAt: number
}

export type GameState = {
  status: GameStatus
  teams: Team[]
  board: RoundItem[]
  myTeam: Team | null
  mySubmissions: Map<string, SubmissionStatus>
  summary: TeamSummary[] | null
  roundStartedAt: string | null
  reviewingRoundItemId: string | null
  currentSubmission: SubmissionForReview | null
  previewBoard: BoardItem[] | null
  teamsLocked: boolean
}

export type GameAction =
  | { type: 'GAME_STARTED'; items: RoundItem[]; roundStartedAt: string }
  | {
      type: 'SQUARE_CLAIMED'
      roundItemId: string
      teamId: string
      teamName: string
      teamColour: string
    }
  | { type: 'SQUARE_PENDING'; roundItemId: string }
  | { type: 'SQUARE_LOCKED'; roundItemId: string; leaderName: string }
  | {
      type: 'SQUARE_UNLOCKED'
      roundItemId: string
      hasPendingSubmissions: boolean
    }
  | { type: 'SUBMISSION_SENT'; roundItemId: string }
  | {
      type: 'SET_SUBMISSION_STATUS'
      roundItemId: string
      status: SubmissionStatus
    }
  | { type: 'SUBMISSION_RESOLVED'; roundItemId: string }
  | {
      type: 'REVIEW_PROMOTED'
      roundItemId: string
      submission: SubmissionForReview
    }
  | { type: 'REVIEW_CLOSED' }
  | { type: 'GAME_ENDED'; summary: TeamSummary[] }
  | { type: 'GAME_LOBBY' }
  | {
      type: 'LOBBY_JOINED'
      teamId: string
      teamName: string
      teamColour: string
    }
  | { type: 'LOBBY_TEAMS'; teams: Team[] }
  | { type: 'FULL_STATE'; state: GameState }
  | { type: 'BOARD_PREVIEW'; board: BoardItem[] }
  | { type: 'BOARD_PREVIEW_REFRESH'; index: number; item: BoardItem }
  | { type: 'BOARD_PREVIEW_CLEAR' }
  | {
      type: 'TEAM_SWITCHED'
      teamId: string
      teamName: string
      teamColour: string
    }
  | { type: 'TEAMS_LOCKED'; locked: boolean }

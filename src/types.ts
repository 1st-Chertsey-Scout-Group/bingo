export type Team = {
  id: string
  index: number
  name: string
  colour: string
  gameId: string
}

export type RoundItem = {
  id: string
  itemId: string
  displayName: string
  claimedByTeamId: string | null
  claimedByTeamName: string | null
  claimedByTeamColour: string | null
  status: 'open' | 'pending' | 'claimed'
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'discarded'

export type TeamSummary = {
  teamId: string
  teamName: string
  teamColour: string
  claimedCount: number
}

export type SubmissionForReview = {
  id: string
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

export type GameState = {
  status: 'lobby' | 'active' | 'ended'
  teams: Team[]
  board: RoundItem[]
  myTeam: Team | null
  mySubmissions: Map<string, SubmissionStatus>
  summary: TeamSummary[] | null
  roundStartedAt: string | null
  locks: Map<string, string>
  reviewingRoundItemId: string | null
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
  | { type: 'SQUARE_UNLOCKED'; roundItemId: string }
  | { type: 'SUBMISSION_RECEIVED'; itemId: string }
  | { type: 'SUBMISSION_APPROVED'; itemId: string }
  | { type: 'SUBMISSION_REJECTED'; itemId: string }
  | { type: 'SUBMISSION_DISCARDED'; itemId: string }
  | {
      type: 'REVIEW_PROMOTED'
      roundItemId: string
      submission: SubmissionForReview
    }
  | { type: 'GAME_ENDED'; summary: TeamSummary[] }
  | { type: 'GAME_LOBBY' }
  | { type: 'LOBBY_TEAMS'; teams: Team[] }
  | { type: 'FULL_STATE'; state: GameState }

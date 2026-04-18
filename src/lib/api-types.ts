import type { GameStatus } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type ErrorResponse = {
  error: string
}

// ---------------------------------------------------------------------------
// POST /api/validate
// ---------------------------------------------------------------------------

export type ValidateRequest = {
  pin: string
}

export type ValidateResponse =
  | { valid: false }
  | { valid: true; role: 'scout'; gameId: string }
  | { valid: true; role: 'leader'; gameId: string; gamePin: string }

// ---------------------------------------------------------------------------
// POST /api/game
// ---------------------------------------------------------------------------

export type CreateGameResponse = {
  gameId: string
  pin: string
  leaderPin: string
  status: GameStatus
}

// ---------------------------------------------------------------------------
// GET /api/game/[gameId]
// ---------------------------------------------------------------------------

export type GameDetailResponse = {
  gameId: string
  pin: string
  status: GameStatus
  teams: { id: string; name: string; colour: string }[]
  board: {
    roundItemId: string
    displayName: string
    claimedByTeamId: string | null
  }[]
}

// ---------------------------------------------------------------------------
// GET /api/items
// POST /api/items
// PUT /api/items/[itemId]
// DELETE /api/items/[itemId]
// ---------------------------------------------------------------------------

export type ItemListResponse = {
  items: ItemResponse[]
}

export type CreateItemRequest = {
  name: string
}

export type UpdateItemRequest = {
  name: string
}

export type ItemResponse = {
  id: string
  name: string
  isDefault: boolean
  isTemplate: boolean
}

// ---------------------------------------------------------------------------
// POST /api/upload
// ---------------------------------------------------------------------------

export type UploadRequest = {
  gameId: string
  teamId: string
  roundItemId: string
  contentType: string
  sessionToken: string
}

export type UploadResponse = {
  uploadUrl: string
  photoUrl: string
}

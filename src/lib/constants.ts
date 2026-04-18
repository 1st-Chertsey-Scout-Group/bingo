export const GAME_STATUS = {
  LOBBY: 'lobby',
  ACTIVE: 'active',
  ENDED: 'ended',
} as const

export type GameStatus = (typeof GAME_STATUS)[keyof typeof GAME_STATUS]

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISCARDED: 'discarded',
} as const

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS]

export const ROLE = {
  SCOUT: 'scout',
  LEADER: 'leader',
} as const

export type Role = (typeof ROLE)[keyof typeof ROLE]

export const BOARD_CONFIG = {
  SIZE_MIN: 9,
  SIZE_MAX: 24,
  SIZE_DEFAULT: 24,
  SIZE_STEP: 3,
  TEMPLATE_MIN: 0,
  TEMPLATE_MAX: 10,
  TEMPLATE_DEFAULT: 5,
} as const

export const ITEM_CATEGORIES = {
  TREES_PLANTS: 'trees-plants',
  ANIMALS_INSECTS: 'animals-insects',
  LANDSCAPE_FEATURES: 'landscape-features',
  ACTIVITIES_CHALLENGES: 'activities-challenges',
  SCAVENGER_FINDS: 'scavenger-finds',
  OBSERVATION: 'observation',
} as const

export type ItemCategory =
  (typeof ITEM_CATEGORIES)[keyof typeof ITEM_CATEGORIES]

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  'trees-plants': 'Trees & Plants',
  'animals-insects': 'Animals & Insects',
  'landscape-features': 'Landscape & Features',
  'activities-challenges': 'Activities & Challenges',
  'scavenger-finds': 'Scavenger Finds',
  observation: 'Observation',
}

export const ALL_CATEGORIES = Object.values(ITEM_CATEGORIES)

export const PIN_REGEX = /^\d{4}$/

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin)
}

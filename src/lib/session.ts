const SESSION_KEY = 'scout-bingo-session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export type ScoutSession = {
  gamePin: string
  gameId: string
  teamId: string
  teamName: string
  teamColour: string
  sessionToken: string
  role: 'scout'
}

export type LeaderSession = {
  gamePin: string
  leaderPin: string
  gameId: string
  leaderName: string
  role: 'leader'
}

export type Session = ScoutSession | LeaderSession

export function saveSession(data: Session): void {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...data, savedAt: Date.now() }),
    )
  } catch {
    // localStorage unavailable
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session & { savedAt?: number }
    if (parsed.savedAt && Date.now() - parsed.savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function savePartialSession(
  data: Partial<ScoutSession> & {
    gamePin: string
    gameId: string
    role: string
  },
): void {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...data, savedAt: Date.now() }),
    )
  } catch {
    // localStorage unavailable
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // localStorage unavailable
  }
}

export function clearTeamIdFromSession(): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, unknown>
    delete parsed.teamId
    delete parsed.teamName
    delete parsed.teamColour
    delete parsed.sessionToken
    localStorage.setItem(SESSION_KEY, JSON.stringify(parsed))
  } catch {
    // localStorage unavailable
  }
}

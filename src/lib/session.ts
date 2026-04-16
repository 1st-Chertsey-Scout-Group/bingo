const SESSION_KEY = 'scout-bingo-session'

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
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
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

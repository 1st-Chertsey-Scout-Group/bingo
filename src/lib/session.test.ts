import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isValidSession,
  saveSession,
  loadSession,
  clearSession,
  clearTeamIdFromSession,
} from '@/lib/session'
import type { ScoutSession, LeaderSession } from '@/lib/session'

describe('isValidSession', () => {
  it('returns true for a valid scout session', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
        sessionToken: 'tok-123',
        role: 'scout',
      }),
    ).toBe(true)
  })

  it('returns true for a valid leader session', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        leaderPin: '5678',
        leaderName: 'Alice',
        role: 'leader',
      }),
    ).toBe(true)
  })

  it('returns false for null', () => {
    expect(isValidSession(null)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isValidSession('string')).toBe(false)
    expect(isValidSession(42)).toBe(false)
    expect(isValidSession(undefined)).toBe(false)
  })

  it('returns false when gamePin is missing', () => {
    expect(
      isValidSession({
        gameId: 'g-1',
        teamId: 't-1',
        teamName: 'Foxes',
        teamColour: '#ff0000',
        sessionToken: 'tok-123',
        role: 'scout',
      }),
    ).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        role: 'admin',
      }),
    ).toBe(false)
  })

  it('returns false for scout session missing required fields', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        role: 'scout',
        // missing teamId, teamName, teamColour, sessionToken
      }),
    ).toBe(false)
  })

  it('returns false for leader session missing required fields', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        role: 'leader',
        // missing leaderPin, leaderName
      }),
    ).toBe(false)
  })

  it('returns false when scout fields have wrong types', () => {
    expect(
      isValidSession({
        gamePin: '1234',
        gameId: 'g-1',
        teamId: 123,
        teamName: 'Foxes',
        teamColour: '#ff0000',
        sessionToken: 'tok-123',
        role: 'scout',
      }),
    ).toBe(false)
  })
})

// Mock localStorage for save/load/clear tests
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key]
  }),
}

describe('saveSession / loadSession', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.stubGlobal('localStorage', localStorageMock)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const scoutSession: ScoutSession = {
    gamePin: '1234',
    gameId: 'g-1',
    teamId: 't-1',
    teamName: 'Foxes',
    teamColour: '#ff0000',
    sessionToken: 'tok-123',
    role: 'scout',
  }

  const leaderSession: LeaderSession = {
    gamePin: '1234',
    gameId: 'g-1',
    leaderPin: '5678',
    leaderName: 'Alice',
    role: 'leader',
  }

  it('saves and loads a scout session', () => {
    saveSession(scoutSession)
    const loaded = loadSession()
    expect(loaded).toMatchObject(scoutSession)
  })

  it('saves and loads a leader session', () => {
    saveSession(leaderSession)
    const loaded = loadSession()
    expect(loaded).toMatchObject(leaderSession)
  })

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull()
  })

  it('returns null and removes expired session', () => {
    // Save with a very old savedAt timestamp
    store['scout-bingo-session'] = JSON.stringify({
      ...scoutSession,
      savedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    })
    expect(loadSession()).toBeNull()
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })

  it('returns null and removes corrupted JSON', () => {
    store['scout-bingo-session'] = 'not-json!!!'
    expect(loadSession()).toBeNull()
  })

  it('returns null and removes session with invalid shape', () => {
    store['scout-bingo-session'] = JSON.stringify({
      role: 'scout',
      // missing required fields
    })
    expect(loadSession()).toBeNull()
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })
})

describe('clearSession', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.stubGlobal('localStorage', localStorageMock)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes the session from localStorage', () => {
    store['scout-bingo-session'] = 'something'
    clearSession()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'scout-bingo-session',
    )
  })
})

describe('clearTeamIdFromSession', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.stubGlobal('localStorage', localStorageMock)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes team fields but keeps other session data', () => {
    store['scout-bingo-session'] = JSON.stringify({
      gamePin: '1234',
      gameId: 'g-1',
      teamId: 't-1',
      teamName: 'Foxes',
      teamColour: '#ff0000',
      sessionToken: 'tok-123',
      role: 'scout',
    })
    clearTeamIdFromSession()

    const saved = JSON.parse(store['scout-bingo-session'])
    expect(saved.teamId).toBeUndefined()
    expect(saved.teamName).toBeUndefined()
    expect(saved.teamColour).toBeUndefined()
    expect(saved.sessionToken).toBeUndefined()
    expect(saved.gamePin).toBe('1234')
  })

  it('does nothing when no session exists', () => {
    clearTeamIdFromSession()
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })
})

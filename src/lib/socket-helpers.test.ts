import { describe, it, expect, vi } from 'vitest'
import {
  SOCKET_ROOMS,
  getSocketContext,
  requireString,
  requireLeaderContext,
  requireScoutContext,
  isLeaderNameTaken,
} from '@/lib/socket-helpers'

function mockSocket(data: Record<string, unknown> = {}) {
  return {
    data,
    emit: vi.fn(),
    id: 'sock-1',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('SOCKET_ROOMS', () => {
  it('formats game room', () => {
    expect(SOCKET_ROOMS.game('abc')).toBe('game:abc')
  })

  it('formats team room', () => {
    expect(SOCKET_ROOMS.team('abc')).toBe('team:abc')
  })

  it('formats leaders room', () => {
    expect(SOCKET_ROOMS.leaders('abc')).toBe('leaders:abc')
  })
})

describe('getSocketContext', () => {
  it('returns null when gameId is not set', () => {
    expect(getSocketContext(mockSocket({}))).toBeNull()
  })

  it('returns context when gameId is set', () => {
    const socket = mockSocket({
      gameId: 'g-1',
      teamId: 't-1',
      leaderName: 'Alice',
      role: 'scout',
    })
    expect(getSocketContext(socket)).toEqual({
      gameId: 'g-1',
      teamId: 't-1',
      leaderName: 'Alice',
      role: 'scout',
    })
  })

  it('returns undefined for missing optional fields', () => {
    const socket = mockSocket({ gameId: 'g-1' })
    const ctx = getSocketContext(socket)
    expect(ctx?.teamId).toBeUndefined()
    expect(ctx?.leaderName).toBeUndefined()
    expect(ctx?.role).toBe('')
  })
})

describe('requireString', () => {
  it('returns true for a non-empty string', () => {
    const socket = mockSocket()
    expect(requireString(socket, 'hello', 'field')).toBe(true)
    expect(socket.emit).not.toHaveBeenCalled()
  })

  it('returns false and emits error for undefined', () => {
    const socket = mockSocket()
    expect(requireString(socket, undefined, 'field')).toBe(false)
    expect(socket.emit).toHaveBeenCalledWith('error', {
      message: 'field is required',
    })
  })

  it('returns false and emits error for empty string', () => {
    const socket = mockSocket()
    expect(requireString(socket, '', 'field')).toBe(false)
    expect(socket.emit).toHaveBeenCalled()
  })

  it('returns false and emits error for whitespace-only string', () => {
    const socket = mockSocket()
    expect(requireString(socket, '   ', 'field')).toBe(false)
    expect(socket.emit).toHaveBeenCalled()
  })

  it('returns false for non-string types', () => {
    const socket = mockSocket()
    expect(requireString(socket, 42, 'field')).toBe(false)
    expect(requireString(socket, null, 'field')).toBe(false)
  })
})

describe('requireLeaderContext', () => {
  it('returns context when both gameId and leaderName are set', () => {
    const socket = mockSocket({ gameId: 'g-1', leaderName: 'Alice' })
    expect(requireLeaderContext(socket)).toEqual({
      gameId: 'g-1',
      leaderName: 'Alice',
    })
  })

  it('returns null and emits error when gameId is missing', () => {
    const socket = mockSocket({ leaderName: 'Alice' })
    expect(requireLeaderContext(socket)).toBeNull()
    expect(socket.emit).toHaveBeenCalledWith('error', {
      message: 'Not connected as a leader',
    })
  })

  it('returns null and emits error when leaderName is missing', () => {
    const socket = mockSocket({ gameId: 'g-1' })
    expect(requireLeaderContext(socket)).toBeNull()
    expect(socket.emit).toHaveBeenCalled()
  })
})

describe('requireScoutContext', () => {
  it('returns context when both gameId and teamId are set', () => {
    const socket = mockSocket({ gameId: 'g-1', teamId: 't-1' })
    expect(requireScoutContext(socket)).toEqual({
      gameId: 'g-1',
      teamId: 't-1',
    })
  })

  it('returns null and emits error when gameId is missing', () => {
    const socket = mockSocket({ teamId: 't-1' })
    expect(requireScoutContext(socket)).toBeNull()
    expect(socket.emit).toHaveBeenCalledWith('error', {
      message: 'Not connected to a game',
    })
  })

  it('returns null and emits error when teamId is missing', () => {
    const socket = mockSocket({ gameId: 'g-1' })
    expect(requireScoutContext(socket)).toBeNull()
    expect(socket.emit).toHaveBeenCalled()
  })
})

describe('isLeaderNameTaken', () => {
  function mockIo(
    sockets: Array<{ id: string; data: Record<string, unknown> }>,
  ) {
    return {
      in: () => ({
        fetchSockets: async () => sockets,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  it('returns true when a connected leader has the same name', async () => {
    const io = mockIo([{ id: 'sock-2', data: { leaderName: 'Alice' } }])
    expect(await isLeaderNameTaken(io, 'g-1', 'alice')).toBe(true)
  })

  it('returns false when no leader has that name', async () => {
    const io = mockIo([{ id: 'sock-2', data: { leaderName: 'Bob' } }])
    expect(await isLeaderNameTaken(io, 'g-1', 'alice')).toBe(false)
  })

  it('returns false when the only matching leader is the excluded socket', async () => {
    const io = mockIo([{ id: 'sock-1', data: { leaderName: 'Alice' } }])
    expect(await isLeaderNameTaken(io, 'g-1', 'alice', 'sock-1')).toBe(false)
  })

  it('returns false when no sockets are connected', async () => {
    const io = mockIo([])
    expect(await isLeaderNameTaken(io, 'g-1', 'alice')).toBe(false)
  })
})

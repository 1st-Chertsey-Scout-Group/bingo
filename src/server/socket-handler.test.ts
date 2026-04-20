import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cancelLockTimeout,
  cancelTeamDeleteTimeout,
  registerSocketHandlers,
} from '@/server/socket-handler'
import { GAME_STATUS } from '@/lib/constants'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    game: { findUnique: vi.fn() },
    team: { delete: vi.fn() },
  },
}))

vi.mock('@/lib/services/lock-service', () => ({
  sweepStaleLocks: vi.fn().mockResolvedValue(undefined),
  findLeaderLock: vi.fn().mockResolvedValue(null),
  releaseLock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/repositories/team', () => ({
  getTeamsInGame: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/server/socket/game', () => ({
  registerGameHandlers: vi.fn(),
}))

vi.mock('@/server/socket/lobby', () => ({
  registerLobbyHandlers: vi.fn(),
}))

vi.mock('@/server/socket/location', () => ({
  registerLocationHandlers: vi.fn(),
}))

vi.mock('@/server/socket/submission', () => ({
  registerSubmissionHandlers: vi.fn(),
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: {
    game: { findUnique: ReturnType<typeof vi.fn> }
    team: { delete: ReturnType<typeof vi.fn> }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cancelLockTimeout', () => {
  it('does not throw when no timeout exists', () => {
    expect(() => cancelLockTimeout('g-1', 'Alice')).not.toThrow()
  })
})

describe('cancelTeamDeleteTimeout', () => {
  it('does not throw when no timeout exists', () => {
    expect(() => cancelTeamDeleteTimeout('t-1')).not.toThrow()
  })
})

describe('registerSocketHandlers', () => {
  function createMockIo() {
    const disconnectHandlers: Array<() => void> = []
    const mockSocket = {
      id: 'sock-1',
      data: {} as Record<string, unknown>,
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'disconnect') {
          disconnectHandlers.push(handler)
        }
      }),
    }
    const io = {
      on: vi.fn(
        (_event: string, handler: (socket: typeof mockSocket) => void) => {
          handler(mockSocket)
        },
      ),
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    }
    return {
      io,
      mockSocket,
      triggerDisconnect: () => {
        for (const handler of disconnectHandlers) handler()
      },
    }
  }

  it('calls sweepStaleLocks on startup', async () => {
    const { io } = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    const lockService = await import('@/lib/services/lock-service')
    expect(lockService.sweepStaleLocks).toHaveBeenCalled()
  })

  it('registers all handler modules on connection', async () => {
    const { io } = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    const lobby = await import('@/server/socket/lobby')
    const game = await import('@/server/socket/game')
    expect(lobby.registerLobbyHandlers).toHaveBeenCalled()
    expect(game.registerGameHandlers).toHaveBeenCalled()
  })

  it('does nothing on disconnect when no context', () => {
    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = {} // no gameId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    triggerDisconnect()

    // No timers should be set
    expect(vi.getTimerCount()).toBe(0)
  })

  it('sets team delete timeout on scout disconnect', () => {
    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = { gameId: 'g-1', teamId: 't-1', role: 'scout' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    triggerDisconnect()

    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)
  })

  it('deletes team after grace period when game is in lobby', async () => {
    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = { gameId: 'g-1', teamId: 't-1', role: 'scout' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    prisma.game.findUnique.mockResolvedValue({
      id: 'g-1',
      status: GAME_STATUS.LOBBY,
    })
    prisma.team.delete.mockResolvedValue({})

    triggerDisconnect()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: 't-1' } })
  })

  it('does not delete team when game is active', async () => {
    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = { gameId: 'g-1', teamId: 't-1', role: 'scout' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    prisma.game.findUnique.mockResolvedValue({
      id: 'g-1',
      status: GAME_STATUS.ACTIVE,
    })

    triggerDisconnect()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(prisma.team.delete).not.toHaveBeenCalled()
  })

  it('sets lock timeout on leader disconnect', () => {
    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = { gameId: 'g-1', leaderName: 'Alice' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    triggerDisconnect()

    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)
  })

  it('releases lock after timeout when leader has a locked item', async () => {
    const lockService = await import('@/lib/services/lock-service')
    ;(
      lockService.findLeaderLock as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({ id: 'ri-1' })

    const { io, mockSocket, triggerDisconnect } = createMockIo()
    mockSocket.data = { gameId: 'g-1', leaderName: 'Alice' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerSocketHandlers(io as any)

    triggerDisconnect()
    await vi.advanceTimersByTimeAsync(30_000)

    expect(lockService.releaseLock).toHaveBeenCalledWith('ri-1')
    expect(io.to).toHaveBeenCalledWith('leaders:g-1')
  })
})

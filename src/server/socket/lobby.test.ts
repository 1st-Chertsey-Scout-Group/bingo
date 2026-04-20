import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSocket, createMockIo, getHandler } from '@/test/mock-socket'
import { GAME_STATUS } from '@/lib/constants'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    game: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    team: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    roundItem: {
      findMany: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/socket-helpers', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/socket-helpers')>()
  return {
    ...original,
    isLeaderNameTaken: vi.fn().mockResolvedValue(false),
  }
})

vi.mock('@/lib/game-mutex', () => ({
  withGameMutex: vi.fn(async (_gameId: string, fn: () => Promise<unknown>) =>
    fn(),
  ),
}))

vi.mock('@/lib/session-token', () => ({
  generateSessionToken: vi.fn().mockReturnValue('tok-123'),
  hashSessionToken: vi.fn().mockReturnValue('hash-123'),
  verifySessionToken: vi.fn().mockReturnValue(true),
}))

vi.mock('@/lib/repositories/team', () => ({
  getTeamsInGame: vi.fn().mockResolvedValue([]),
  getAllTeamsInGame: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/teams', () => ({
  TEAMS: [
    { name: 'Foxes', colour: '#ff0000' },
    { name: 'Hawks', colour: '#0000ff' },
  ],
  pickRandomUnusedTeam: vi
    .fn()
    .mockReturnValue({ name: 'Foxes', colour: '#ff0000' }),
}))

vi.mock('@/server/socket-handler', () => ({
  cancelLockTimeout: vi.fn(),
  cancelTeamDeleteTimeout: vi.fn(),
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>
}

import { registerLobbyHandlers } from '@/server/socket/lobby'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerLobbyHandlers', () => {
  it('registers lobby:join, rejoin, team:switch, team:lock', () => {
    const socket = createMockSocket()
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLobbyHandlers(io as any, socket as any)

    const events = socket.on.mock.calls.map((c: [string, unknown]) => c[0])
    expect(events).toContain('lobby:join')
    expect(events).toContain('rejoin')
    expect(events).toContain('team:switch')
    expect(events).toContain('team:lock')
  })

  describe('lobby:join', () => {
    it('emits error when gamePin is missing', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'lobby:join')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'gamePin is required',
      })
    })

    it('emits error when game not found', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue(null)

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game not found',
      })
    })

    it('emits error when game is not in lobby', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
        pin: '1234',
        leaderPin: '5678',
      })

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not in lobby',
      })
    })

    it('creates team and joins rooms for scout', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
        teamsLocked: false,
      })
      prisma.team.findMany.mockResolvedValue([])
      prisma.team.create.mockResolvedValue({
        id: 't-1',
        name: 'Foxes',
        colour: '#ff0000',
      })

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234' })

      expect(socket.join).toHaveBeenCalledWith('game:g-1')
      expect(socket.join).toHaveBeenCalledWith('team:t-1')
      expect(socket.emit).toHaveBeenCalledWith(
        'lobby:joined',
        expect.objectContaining({
          teamId: 't-1',
          teamName: 'Foxes',
          sessionToken: 'tok-123',
        }),
      )
    })

    it('joins as leader with valid leaderPin', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
      })

      const handler = getHandler(socket, 'lobby:join')
      await handler({
        gamePin: '1234',
        leaderPin: '5678',
        leaderName: 'Alice',
      })

      expect(socket.join).toHaveBeenCalledWith('game:g-1')
      expect(socket.join).toHaveBeenCalledWith('leaders:g-1')
      expect(socket.data.leaderName).toBe('Alice')
      expect(socket.emit).toHaveBeenCalledWith(
        'lobby:joined',
        expect.objectContaining({ leaderName: 'Alice' }),
      )
    })

    it('emits error for invalid leader PIN', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
      })

      const handler = getHandler(socket, 'lobby:join')
      await handler({
        gamePin: '1234',
        leaderPin: '9999',
        leaderName: 'Alice',
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid leader PIN',
      })
    })
  })

  describe('lobby:join — edge cases', () => {
    it('emits error when no more teams available', async () => {
      const { pickRandomUnusedTeam } = await import('@/lib/teams')
      ;(pickRandomUnusedTeam as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        null,
      )

      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
        teamsLocked: false,
      })
      prisma.team.findMany.mockResolvedValue([])

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'No more teams available',
      })
    })

    it('emits error when leader name is empty', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
      })

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234', leaderPin: '5678', leaderName: '' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'leaderName is required',
      })
    })

    it('skips team creation when socket already has a live team', async () => {
      const socket = createMockSocket({ teamId: 't-existing' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        pin: '1234',
        leaderPin: '5678',
        teamsLocked: false,
      })
      prisma.team.findUnique.mockResolvedValue({ id: 't-existing' })

      const handler = getHandler(socket, 'lobby:join')
      await handler({ gamePin: '1234' })

      // Should not create a new team
      expect(prisma.team.create).not.toHaveBeenCalled()
    })
  })

  describe('rejoin', () => {
    it('emits rejoin:error when gamePin is missing', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'rejoin')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('rejoin:error', {
        message: 'gamePin is required',
      })
    })

    it('emits rejoin:error when game not found', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue(null)

      const handler = getHandler(socket, 'rejoin')
      await handler({ gamePin: '1234', teamId: 't-1', sessionToken: 'tok' })

      expect(socket.emit).toHaveBeenCalledWith('rejoin:error', {
        message: 'Game not found',
      })
    })

    it('emits rejoin:error when game has ended', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ENDED,
      })

      const handler = getHandler(socket, 'rejoin')
      await handler({ gamePin: '1234', teamId: 't-1', sessionToken: 'tok' })

      expect(socket.emit).toHaveBeenCalledWith('rejoin:error', {
        message: 'Game has ended',
      })
    })
  })

  describe('rejoin — scout happy path', () => {
    it('rejoins scout and emits rejoin:state', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
        pin: '1234',
        leaderPin: '5678',
        roundStartedAt: new Date('2026-01-01'),
        teamsLocked: false,
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        name: 'Foxes',
        colour: '#ff0000',
        sessionTokenHash: 'hash-123',
      })
      prisma.team.update.mockResolvedValue({})
      prisma.team.findMany.mockResolvedValue([
        { id: 't-1', name: 'Foxes', colour: '#ff0000' },
      ])
      prisma.roundItem.findMany.mockResolvedValue([])
      prisma.submission.findMany.mockResolvedValue([])

      const handler = getHandler(socket, 'rejoin')
      await handler({ gamePin: '1234', teamId: 't-1', sessionToken: 'tok-123' })

      expect(socket.join).toHaveBeenCalledWith('game:g-1')
      expect(socket.join).toHaveBeenCalledWith('team:t-1')
      expect(socket.data.gameId).toBe('g-1')
      expect(socket.data.teamId).toBe('t-1')
      expect(socket.emit).toHaveBeenCalledWith(
        'rejoin:state',
        expect.objectContaining({
          status: GAME_STATUS.ACTIVE,
          myTeam: expect.objectContaining({ id: 't-1', name: 'Foxes' }),
        }),
      )
    })

    it('emits rejoin:error for invalid session token', async () => {
      const { verifySessionToken } = await import('@/lib/session-token')
      ;(verifySessionToken as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        false,
      )

      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.team.findUnique.mockResolvedValue({
        id: 't-1',
        gameId: 'g-1',
        sessionTokenHash: 'hash-123',
      })

      const handler = getHandler(socket, 'rejoin')
      await handler({ gamePin: '1234', teamId: 't-1', sessionToken: 'bad' })

      expect(socket.emit).toHaveBeenCalledWith('rejoin:error', {
        message: 'Invalid session token',
      })
    })
  })

  describe('rejoin — leader happy path', () => {
    it('rejoins leader and emits rejoin:state', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
        pin: '1234',
        leaderPin: '5678',
        roundStartedAt: new Date('2026-01-01'),
        teamsLocked: false,
      })
      prisma.team.findMany.mockResolvedValue([])
      prisma.roundItem.findMany.mockResolvedValue([])

      const handler = getHandler(socket, 'rejoin')
      await handler({
        gamePin: '1234',
        leaderPin: '5678',
        leaderName: 'Alice',
      })

      expect(socket.join).toHaveBeenCalledWith('game:g-1')
      expect(socket.join).toHaveBeenCalledWith('leaders:g-1')
      expect(socket.data.leaderName).toBe('Alice')
      expect(socket.emit).toHaveBeenCalledWith(
        'rejoin:state',
        expect.objectContaining({
          status: GAME_STATUS.ACTIVE,
          myTeam: null,
        }),
      )
    })

    it('emits rejoin:error for invalid leader PIN', async () => {
      const socket = createMockSocket()
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findFirst.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
        leaderPin: '5678',
      })

      const handler = getHandler(socket, 'rejoin')
      await handler({
        gamePin: '1234',
        leaderPin: '9999',
        leaderName: 'Alice',
      })

      expect(socket.emit).toHaveBeenCalledWith('rejoin:error', {
        message: 'Invalid leader PIN',
      })
    })
  })

  describe('team:switch', () => {
    it('emits error for invalid team name', async () => {
      const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'team:switch')
      await handler({ targetTeamName: 'NonExistentTeam' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid team name',
      })
    })

    it('switches team successfully', async () => {
      const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        teamsLocked: false,
      })
      prisma.team.findUnique.mockResolvedValue(null) // target not taken
      prisma.team.delete.mockResolvedValue({})
      prisma.team.create.mockResolvedValue({
        id: 't-2',
        name: 'Hawks',
        colour: '#0000ff',
      })

      const handler = getHandler(socket, 'team:switch')
      await handler({ targetTeamName: 'Hawks' })

      expect(socket.leave).toHaveBeenCalledWith('team:t-1')
      expect(socket.join).toHaveBeenCalledWith('team:t-2')
      expect(socket.emit).toHaveBeenCalledWith(
        'team:switched',
        expect.objectContaining({
          teamId: 't-2',
          teamName: 'Hawks',
        }),
      )
    })

    it('emits error when teams are locked', async () => {
      const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
        teamsLocked: true,
      })

      const handler = getHandler(socket, 'team:switch')
      await handler({ targetTeamName: 'Hawks' })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Team selection is locked',
      })
    })
  })

  describe('team:lock', () => {
    it('emits error when locked is not a boolean', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'team:lock')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'locked is required',
      })
    })

    it('updates game and broadcasts lock state', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerLobbyHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.game.update.mockResolvedValue({})

      const handler = getHandler(socket, 'team:lock')
      await handler({ locked: true })

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: 'g-1' },
        data: { teamsLocked: true },
      })
      expect(io.to).toHaveBeenCalledWith('game:g-1')
    })
  })
})

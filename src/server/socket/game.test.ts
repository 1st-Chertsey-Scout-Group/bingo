import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSocket, createMockIo, getHandler } from '@/test/mock-socket'
import { GAME_STATUS } from '@/lib/constants'

// Mock all external dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    game: { findUnique: vi.fn(), update: vi.fn() },
    team: { findMany: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    roundItem: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    item: { findMany: vi.fn() },
    templateValue: { findMany: vi.fn() },
    submission: { deleteMany: vi.fn() },
    pendingUpload: { findMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/s3', () => ({
  deleteObjects: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/server/socket/location', () => ({
  clearGameLocations: vi.fn(),
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>
}

import { registerGameHandlers, endGame } from '@/server/socket/game'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('endGame', () => {
  it('updates game status to ended and emits summary', async () => {
    prisma.game.update.mockResolvedValue({})
    prisma.pendingUpload.findMany.mockResolvedValue([])
    prisma.team.findMany.mockResolvedValue([
      { id: 't-1', name: 'Foxes', colour: '#ff0000' },
      { id: 't-2', name: 'Hawks', colour: '#0000ff' },
    ])
    prisma.roundItem.findMany.mockResolvedValue([
      { claimedByTeamId: 't-1' },
      { claimedByTeamId: 't-1' },
      { claimedByTeamId: 't-2' },
    ])

    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await endGame(io as any, 'g-1')

    expect(prisma.game.update).toHaveBeenCalledWith({
      where: { id: 'g-1' },
      data: { status: GAME_STATUS.ENDED },
    })
    expect(io.to).toHaveBeenCalledWith('game:g-1')
    const emitCall = io.to.mock.results[0].value.emit
    expect(emitCall).toHaveBeenCalledWith('game:ended', {
      summary: expect.arrayContaining([
        expect.objectContaining({ teamId: 't-1', claimedCount: 2 }),
        expect.objectContaining({ teamId: 't-2', claimedCount: 1 }),
      ]),
    })
  })
})

describe('registerGameHandlers', () => {
  it('registers game:end, game:start, game:newround, board:preview, board:refresh-item', () => {
    const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerGameHandlers(io as any, socket as any)

    const events = socket.on.mock.calls.map((c: [string, unknown]) => c[0])
    expect(events).toContain('game:end')
    expect(events).toContain('game:start')
    expect(events).toContain('game:newround')
    expect(events).toContain('board:preview')
    expect(events).toContain('board:refresh-item')
  })

  describe('game:end', () => {
    it('emits error when game is not active or lobby', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ENDED,
      })

      const handler = getHandler(socket, 'game:end')
      await handler()

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not active',
      })
    })

    it('calls endGame when game is active', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })
      prisma.game.update.mockResolvedValue({})
      prisma.pendingUpload.findMany.mockResolvedValue([])
      prisma.team.findMany.mockResolvedValue([])
      prisma.roundItem.findMany.mockResolvedValue([])

      const handler = getHandler(socket, 'game:end')
      await handler()

      expect(prisma.game.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: GAME_STATUS.ENDED },
        }),
      )
    })

    it('allows ending from lobby status', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.game.update.mockResolvedValue({})
      prisma.pendingUpload.findMany.mockResolvedValue([])
      prisma.team.findMany.mockResolvedValue([])
      prisma.roundItem.findMany.mockResolvedValue([])

      const handler = getHandler(socket, 'game:end')
      await handler()

      expect(prisma.game.update).toHaveBeenCalled()
    })
  })

  describe('game:newround', () => {
    it('emits error when game is not ended', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })

      const handler = getHandler(socket, 'game:newround')
      await handler()

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not ended',
      })
    })

    it('resets game to lobby and clears round data', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ENDED,
      })
      prisma.submission.deleteMany.mockResolvedValue({})
      prisma.pendingUpload.deleteMany.mockResolvedValue({})
      prisma.roundItem.deleteMany.mockResolvedValue({})
      prisma.team.deleteMany.mockResolvedValue({})
      prisma.game.update.mockResolvedValue({})

      const handler = getHandler(socket, 'game:newround')
      await handler()

      expect(prisma.submission.deleteMany).toHaveBeenCalled()
      expect(prisma.roundItem.deleteMany).toHaveBeenCalled()
      expect(prisma.team.deleteMany).toHaveBeenCalled()
      expect(prisma.game.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GAME_STATUS.LOBBY,
            teamsLocked: false,
          }),
        }),
      )
      expect(io.to).toHaveBeenCalledWith('game:g-1')
    })
  })

  describe('game:start', () => {
    it('emits error when not in lobby', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })

      const handler = getHandler(socket, 'game:start')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not in lobby',
      })
    })

    it('emits error when no teams exist', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(0)

      const handler = getHandler(socket, 'game:start')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'At least one team required',
      })
    })

    it('emits error for invalid board size', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(2)

      const handler = getHandler(socket, 'game:start')
      await handler({
        confirmedBoard: [{ itemId: 'i-1', displayName: 'Oak' }],
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid board size',
      })
    })

    it('starts round with confirmed board', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(2)

      const board = Array.from({ length: 9 }, (_, i) => ({
        itemId: `i-${String(i)}`,
        displayName: `Item ${String(i)}`,
      }))
      prisma.item.findMany.mockResolvedValue(
        board.map((b) => ({ id: b.itemId })),
      )

      const now = new Date()
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            game: {
              update: vi.fn().mockResolvedValue({
                id: 'g-1',
                roundStartedAt: now,
              }),
            },
            roundItem: {
              createMany: vi.fn().mockResolvedValue({}),
              findMany: vi.fn().mockResolvedValue(
                board.map((b, i) => ({
                  id: `ri-${String(i)}`,
                  displayName: b.displayName,
                })),
              ),
            },
          }
          return fn(tx)
        },
      )

      const handler = getHandler(socket, 'game:start')
      await handler({ confirmedBoard: board })

      expect(io.to).toHaveBeenCalledWith('game:g-1')
      const emitCall = io.to.mock.results[0].value.emit
      expect(emitCall).toHaveBeenCalledWith(
        'game:started',
        expect.objectContaining({
          board: expect.arrayContaining([
            expect.objectContaining({ displayName: 'Item 0' }),
          ]),
        }),
      )
    })
  })

  describe('board:preview', () => {
    it('emits error when not a leader', async () => {
      const socket = createMockSocket({}) // no leaderName
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      const handler = getHandler(socket, 'board:preview')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Not connected as a leader',
      })
    })

    it('emits error for invalid categories', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })

      const handler = getHandler(socket, 'board:preview')
      await handler({ categories: ['invalid'], boardSize: 9, templateCount: 2 })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid categories',
      })
    })

    it('emits error for invalid board configuration', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })

      const handler = getHandler(socket, 'board:preview')
      await handler({
        categories: ['trees-plants'],
        boardSize: 10, // invalid, not divisible by 3
        templateCount: 2,
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid board configuration',
      })
    })
  })

  describe('game:start — auto-generate fallback', () => {
    it('auto-generates board when no confirmedBoard provided', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(2)

      // Mock queryBoardData items
      const items = Array.from({ length: 30 }, (_, i) => ({
        id: `item-${String(i)}`,
        name: `Item ${String(i)}`,
        category: 'trees-plants',
        isTemplate: false,
      }))
      prisma.item.findMany
        .mockResolvedValueOnce(items) // concreteItems
        .mockResolvedValueOnce([]) // templateItems
      prisma.templateValue = { findMany: vi.fn().mockResolvedValue([]) }

      const now = new Date()
      prisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            game: {
              update: vi
                .fn()
                .mockResolvedValue({ id: 'g-1', roundStartedAt: now }),
            },
            roundItem: {
              createMany: vi.fn().mockResolvedValue({}),
              findMany: vi
                .fn()
                .mockResolvedValue([{ id: 'ri-0', displayName: 'Item 0' }]),
            },
          }
          return fn(tx)
        },
      )

      const handler = getHandler(socket, 'game:start')
      await handler({}) // no confirmedBoard

      expect(io.to).toHaveBeenCalledWith('game:g-1')
    })

    it('emits error when game not found during auto-generate', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue(null)

      const handler = getHandler(socket, 'game:start')
      await handler({})

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game not found',
      })
    })

    it('emits error when transaction fails', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(2)

      const board = Array.from({ length: 9 }, (_, i) => ({
        itemId: `i-${String(i)}`,
        displayName: `Item ${String(i)}`,
      }))
      prisma.item.findMany.mockResolvedValue(
        board.map((b) => ({ id: b.itemId })),
      )
      prisma.$transaction.mockRejectedValue(new Error('DB error'))

      const handler = getHandler(socket, 'game:start')
      await handler({ confirmedBoard: board })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'DB error',
      })
    })

    it('emits error when confirmed board has invalid items', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })
      prisma.team.count.mockResolvedValue(2)

      const board = Array.from({ length: 9 }, (_, i) => ({
        itemId: `i-${String(i)}`,
        displayName: `Item ${String(i)}`,
      }))
      // Return fewer items than board has — some itemIds are invalid
      prisma.item.findMany.mockResolvedValue([{ id: 'i-0' }])

      const handler = getHandler(socket, 'game:start')
      await handler({ confirmedBoard: board })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Board contains invalid items',
      })
    })
  })

  describe('board:refresh-item', () => {
    it('emits error for invalid payload', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.LOBBY,
      })

      const handler = getHandler(socket, 'board:refresh-item')
      await handler(undefined)

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid refresh request',
      })
    })

    it('emits error when game is not in lobby', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue({
        id: 'g-1',
        status: GAME_STATUS.ACTIVE,
      })

      const handler = getHandler(socket, 'board:refresh-item')
      await handler({
        currentBoard: [{ itemId: 'i-1', displayName: 'Oak' }],
        indexToReplace: 0,
        categories: ['trees-plants'],
      })

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not in lobby',
      })
    })
  })

  describe('game:end — edge cases', () => {
    it('emits error when game not found', async () => {
      const socket = createMockSocket({ gameId: 'g-1', leaderName: 'Alice' })
      const io = createMockIo()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerGameHandlers(io as any, socket as any)

      prisma.game.findUnique.mockResolvedValue(null)

      const handler = getHandler(socket, 'game:end')
      await handler()

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not active',
      })
    })
  })
})

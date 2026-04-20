import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSocket, createMockIo, getHandler } from '@/test/mock-socket'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    team: { findUnique: vi.fn() },
  },
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: { team: { findUnique: ReturnType<typeof vi.fn> } }
}

import {
  clearGameLocations,
  registerLocationHandlers,
} from '@/server/socket/location'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('clearGameLocations', () => {
  it('does not throw when clearing a non-existent game', () => {
    expect(() => clearGameLocations('non-existent')).not.toThrow()
  })
})

describe('registerLocationHandlers', () => {
  it('registers location:update handler', () => {
    const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLocationHandlers(io as any, socket as any)

    const events = socket.on.mock.calls.map((c: [string, unknown]) => c[0])
    expect(events).toContain('location:update')
  })

  it('silently ignores missing payload', async () => {
    const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLocationHandlers(io as any, socket as any)

    const handler = getHandler(socket, 'location:update')
    await handler(undefined)

    expect(prisma.team.findUnique).not.toHaveBeenCalled()
  })

  it('silently ignores invalid coordinates', async () => {
    const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLocationHandlers(io as any, socket as any)

    const handler = getHandler(socket, 'location:update')

    // lat out of range
    await handler({ lat: 100, lng: 0, accuracy: 10 })
    expect(prisma.team.findUnique).not.toHaveBeenCalled()

    // lng out of range
    await handler({ lat: 0, lng: 200, accuracy: 10 })
    expect(prisma.team.findUnique).not.toHaveBeenCalled()

    // negative accuracy
    await handler({ lat: 0, lng: 0, accuracy: -1 })
    expect(prisma.team.findUnique).not.toHaveBeenCalled()
  })

  it('silently ignores non-number coordinates', async () => {
    const socket = createMockSocket({ gameId: 'g-1', teamId: 't-1' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLocationHandlers(io as any, socket as any)

    const handler = getHandler(socket, 'location:update')
    await handler({ lat: 'not-a-number', lng: 0, accuracy: 10 })

    expect(prisma.team.findUnique).not.toHaveBeenCalled()
  })

  it('stores position for valid coordinates and reuses on update', async () => {
    // Use unique gameId/teamId to avoid shared state from other tests
    const socket = createMockSocket({ gameId: 'g-loc', teamId: 't-loc' })
    const io = createMockIo()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerLocationHandlers(io as any, socket as any)

    prisma.team.findUnique.mockResolvedValue({
      name: 'Foxes',
      colour: '#ff0000',
    })

    const handler = getHandler(socket, 'location:update')

    // First call stores — triggers DB lookup
    await handler({ lat: 51.5, lng: -0.12, accuracy: 15 })
    expect(prisma.team.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: 't-loc' },
      select: { name: true, colour: true },
    })

    // Second call updates in-memory — no additional DB call
    await handler({ lat: 51.6, lng: -0.13, accuracy: 10 })
    expect(prisma.team.findUnique).toHaveBeenCalledTimes(1)
  })
})

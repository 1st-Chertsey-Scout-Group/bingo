import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTeamsInGame, getAllTeamsInGame } from '@/lib/repositories/team'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findMany: vi.fn(),
    },
  },
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: {
    team: {
      findMany: ReturnType<typeof vi.fn>
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTeamsInGame', () => {
  it('queries teams with correct filter and ordering', async () => {
    const teams = [{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]
    prisma.team.findMany.mockResolvedValue(teams)

    const result = await getTeamsInGame('g-1')

    expect(result).toBe(teams)
    expect(prisma.team.findMany).toHaveBeenCalledWith({
      where: { gameId: 'g-1' },
      select: { id: true, name: true, colour: true },
      orderBy: { createdAt: 'asc' },
    })
  })
})

describe('getAllTeamsInGame', () => {
  it('queries all teams without ordering', async () => {
    const teams = [{ id: 't-1', name: 'Foxes', colour: '#ff0000' }]
    prisma.team.findMany.mockResolvedValue(teams)

    const result = await getAllTeamsInGame('g-1')

    expect(result).toBe(teams)
    expect(prisma.team.findMany).toHaveBeenCalledWith({
      where: { gameId: 'g-1' },
      select: { id: true, name: true, colour: true },
    })
  })
})

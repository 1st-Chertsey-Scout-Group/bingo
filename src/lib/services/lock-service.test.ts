import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sweepStaleLocks,
  releaseLock,
  acquireLock,
  releaseLeaderLock,
  findLeaderLock,
  UNLOCK_DATA,
} from '@/lib/services/lock-service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    roundItem: {
      updateMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: {
    roundItem: {
      updateMany: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
      findFirst: ReturnType<typeof vi.fn>
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sweepStaleLocks', () => {
  it('calls updateMany with correct filter and data', async () => {
    prisma.roundItem.updateMany.mockResolvedValue({ count: 2 })
    await sweepStaleLocks()

    expect(prisma.roundItem.updateMany).toHaveBeenCalledWith({
      where: { lockedAt: { not: null } },
      data: UNLOCK_DATA,
    })
  })
})

describe('releaseLock', () => {
  it('calls update with UNLOCK_DATA for the given roundItemId', async () => {
    prisma.roundItem.update.mockResolvedValue({})
    await releaseLock('ri-1')

    expect(prisma.roundItem.update).toHaveBeenCalledWith({
      where: { id: 'ri-1' },
      data: UNLOCK_DATA,
    })
  })
})

describe('acquireLock', () => {
  it('calls update with leaderName and a Date for lockedAt', async () => {
    prisma.roundItem.update.mockResolvedValue({})
    await acquireLock('ri-1', 'Alice')

    const call = prisma.roundItem.update.mock.calls[0][0]
    expect(call.where).toEqual({ id: 'ri-1' })
    expect(call.data.lockedByLeader).toBe('Alice')
    expect(call.data.lockedAt).toBeInstanceOf(Date)
  })
})

describe('releaseLeaderLock', () => {
  it('returns the released roundItem id when one exists', async () => {
    prisma.roundItem.findFirst.mockResolvedValue({ id: 'ri-1' })
    prisma.roundItem.update.mockResolvedValue({})

    const result = await releaseLeaderLock('g-1', 'Alice')

    expect(result).toBe('ri-1')
    expect(prisma.roundItem.update).toHaveBeenCalledWith({
      where: { id: 'ri-1' },
      data: UNLOCK_DATA,
    })
  })

  it('returns null when no lock is found', async () => {
    prisma.roundItem.findFirst.mockResolvedValue(null)

    const result = await releaseLeaderLock('g-1', 'Alice')

    expect(result).toBeNull()
    expect(prisma.roundItem.update).not.toHaveBeenCalled()
  })

  it('excludes the given roundItemId from the query', async () => {
    prisma.roundItem.findFirst.mockResolvedValue(null)

    await releaseLeaderLock('g-1', 'Alice', 'ri-exclude')

    const call = prisma.roundItem.findFirst.mock.calls[0][0]
    expect(call.where.id).toEqual({ not: 'ri-exclude' })
  })
})

describe('findLeaderLock', () => {
  it('calls findFirst with correct filter', async () => {
    prisma.roundItem.findFirst.mockResolvedValue({ id: 'ri-1' })

    const result = await findLeaderLock('g-1', 'Alice')

    expect(result).toEqual({ id: 'ri-1' })
    expect(prisma.roundItem.findFirst).toHaveBeenCalledWith({
      where: { gameId: 'g-1', lockedByLeader: 'Alice' },
    })
  })
})

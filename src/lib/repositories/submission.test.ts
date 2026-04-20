import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNextPendingSubmission } from '@/lib/repositories/submission'
import { SUBMISSION_STATUS } from '@/lib/constants'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    submission: {
      findFirst: vi.fn(),
    },
  },
}))

const { prisma } = (await import('@/lib/prisma')) as {
  prisma: {
    submission: {
      findFirst: ReturnType<typeof vi.fn>
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getNextPendingSubmission', () => {
  it('queries for the first pending submission ordered by position', async () => {
    const mockSubmission = { id: 's-1', roundItemId: 'ri-1', status: 'pending' }
    prisma.submission.findFirst.mockResolvedValue(mockSubmission)

    const result = await getNextPendingSubmission('ri-1')

    expect(result).toBe(mockSubmission)
    expect(prisma.submission.findFirst).toHaveBeenCalledWith({
      where: { roundItemId: 'ri-1', status: SUBMISSION_STATUS.PENDING },
      orderBy: { position: 'asc' },
      include: { team: true, roundItem: true },
    })
  })

  it('returns null when no pending submission exists', async () => {
    prisma.submission.findFirst.mockResolvedValue(null)

    const result = await getNextPendingSubmission('ri-1')

    expect(result).toBeNull()
  })
})

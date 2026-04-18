import { SUBMISSION_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

export async function getNextPendingSubmission(roundItemId: string) {
  return prisma.submission.findFirst({
    where: { roundItemId, status: SUBMISSION_STATUS.PENDING },
    orderBy: { position: 'asc' },
    include: { team: true, roundItem: true },
  })
}

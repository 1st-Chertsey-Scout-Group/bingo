import { prisma } from '@/lib/prisma'

export const UNLOCK_DATA = {
  lockedByLeader: null,
  lockedAt: null,
} as const

export async function sweepStaleLocks(): Promise<void> {
  await prisma.roundItem.updateMany({
    where: { lockedAt: { not: null } },
    data: UNLOCK_DATA,
  })
}

export async function releaseLock(roundItemId: string): Promise<void> {
  await prisma.roundItem.update({
    where: { id: roundItemId },
    data: UNLOCK_DATA,
  })
}

export async function acquireLock(
  roundItemId: string,
  leaderName: string,
): Promise<void> {
  await prisma.roundItem.update({
    where: { id: roundItemId },
    data: { lockedByLeader: leaderName, lockedAt: new Date() },
  })
}

export async function releaseLeaderLock(
  gameId: string,
  leaderName: string,
  excludeRoundItemId?: string,
): Promise<string | null> {
  const existing = await prisma.roundItem.findFirst({
    where: {
      gameId,
      lockedByLeader: leaderName,
      ...(excludeRoundItemId ? { id: { not: excludeRoundItemId } } : {}),
    },
  })

  if (existing) {
    await prisma.roundItem.update({
      where: { id: existing.id },
      data: UNLOCK_DATA,
    })
    return existing.id
  }

  return null
}

export async function findLeaderLock(
  gameId: string,
  leaderName: string,
): Promise<{ id: string } | null> {
  return prisma.roundItem.findFirst({
    where: { gameId, lockedByLeader: leaderName },
  })
}

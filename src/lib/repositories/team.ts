import { prisma } from '@/lib/prisma'

const TEAM_SELECT = {
  id: true,
  name: true,
  colour: true,
} as const

export async function getTeamsInGame(gameId: string) {
  return prisma.team.findMany({
    where: { gameId },
    select: TEAM_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getAllTeamsInGame(gameId: string) {
  return prisma.team.findMany({
    where: { gameId },
    select: TEAM_SELECT,
  })
}

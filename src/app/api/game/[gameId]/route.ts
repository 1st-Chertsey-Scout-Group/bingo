import { NextResponse } from 'next/server'

import { notFound } from '@/lib/admin'
import type { GameDetailResponse } from '@/lib/api-types'
import { GAME_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { getTeamsInGame } from '@/lib/repositories/team'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  })

  if (!game) {
    return notFound('Game not found')
  }

  const teams = await getTeamsInGame(game.id)

  let board: {
    roundItemId: string
    displayName: string
    claimedByTeamId: string | null
  }[] = []

  if (game.status === GAME_STATUS.ACTIVE) {
    const roundItems = await prisma.roundItem.findMany({
      where: { gameId: game.id },
      include: { item: true },
    })

    board = roundItems.map((ri) => ({
      roundItemId: ri.id,
      displayName: ri.displayName,
      claimedByTeamId: ri.claimedByTeamId,
    }))
  }

  return NextResponse.json<GameDetailResponse>({
    gameId: game.id,
    pin: game.pin,
    status: game.status as GameDetailResponse['status'],
    teams,
    board,
  })
}

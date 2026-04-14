import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  const teams = await prisma.team.findMany({
    where: { gameId: game.id, round: game.round },
    select: { id: true, name: true, colour: true },
  })

  let board: {
    roundItemId: string
    displayName: string
    claimedByTeamId: string | null
  }[] = []

  if (game.status === 'active') {
    const roundItems = await prisma.roundItem.findMany({
      where: { gameId: game.id, round: game.round },
      include: { item: true },
    })

    board = roundItems.map((ri) => ({
      roundItemId: ri.id,
      displayName: ri.displayName,
      claimedByTeamId: ri.claimedByTeamId,
    }))
  }

  return NextResponse.json({
    gameId: game.id,
    pin: game.pin,
    status: game.status,
    round: game.round,
    boardSize: game.boardSize,
    templateCount: game.templateCount,
    teams,
    board,
  })
}

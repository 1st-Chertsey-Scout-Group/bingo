import { NextResponse } from 'next/server'

import { checkAdminPin, unauthorizedResponse } from '@/lib/admin'
import type { CreateGameResponse } from '@/lib/api-types'
import { GAME_STATUS } from '@/lib/constants'
import { generateLeaderPin, generateScoutPin } from '@/lib/game-logic'
import { prisma } from '@/lib/prisma'

async function findUniquePin(generator: () => string): Promise<string | null> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generator()
    const existing = await prisma.game.findFirst({
      where: {
        status: { not: GAME_STATUS.ENDED },
        OR: [{ pin: candidate }, { leaderPin: candidate }],
      },
    })
    if (!existing) return candidate
  }
  return null
}

export async function POST(request: Request) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const [pin, leaderPin] = await Promise.all([
    findUniquePin(generateScoutPin),
    findUniquePin(generateLeaderPin),
  ])

  if (!pin || !leaderPin) {
    return NextResponse.json(
      { error: 'Failed to generate unique PINs' },
      { status: 500 },
    )
  }

  const game = await prisma.game.create({
    data: {
      pin,
      leaderPin,
      status: GAME_STATUS.LOBBY,
    },
  })

  return NextResponse.json<CreateGameResponse>(
    {
      gameId: game.id,
      pin: game.pin,
      leaderPin: game.leaderPin,
      status: game.status as CreateGameResponse['status'],
    },
    { status: 201 },
  )
}

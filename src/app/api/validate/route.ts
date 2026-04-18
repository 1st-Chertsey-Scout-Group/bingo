import { NextResponse } from 'next/server'

import type { ValidateRequest, ValidateResponse } from '@/lib/api-types'
import { parseBody } from '@/lib/api-validation'
import { GAME_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const parsed = parseBody<ValidateRequest>(await request.json(), ['pin'])
  if (!parsed.ok) return parsed.response
  const { pin } = parsed.data

  const game = await prisma.game.findFirst({
    where: {
      status: { not: GAME_STATUS.ENDED },
      OR: [{ pin }, { leaderPin: pin }],
    },
  })

  if (!game) {
    return NextResponse.json<ValidateResponse>({ valid: false })
  }

  if (game.pin === pin) {
    return NextResponse.json<ValidateResponse>({
      valid: true,
      role: 'scout',
      gameId: game.id,
    })
  }

  return NextResponse.json<ValidateResponse>({
    valid: true,
    role: 'leader',
    gameId: game.id,
    gamePin: game.pin,
  })
}

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body: unknown = await request.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('pin' in body) ||
    typeof (body as Record<string, unknown>).pin !== 'string'
  ) {
    return NextResponse.json({ error: 'pin is required' }, { status: 400 })
  }

  const { pin } = body as { pin: string }

  const game = await prisma.game.findFirst({
    where: {
      status: { not: 'ended' },
      OR: [{ pin }, { leaderPin: pin }],
    },
  })

  if (!game) {
    return NextResponse.json({ valid: false })
  }

  if (game.pin === pin) {
    return NextResponse.json({ valid: true, role: 'scout', gameId: game.id })
  }

  return NextResponse.json({
    valid: true,
    role: 'leader',
    gameId: game.id,
    gamePin: game.pin,
  })
}

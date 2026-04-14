import { NextResponse } from 'next/server'

import { checkAdminPin, unauthorizedResponse } from '@/lib/admin'
import { generatePin } from '@/lib/game-logic'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const body: unknown = await request.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('leaderPin' in body) ||
    typeof (body as Record<string, unknown>).leaderPin !== 'string' ||
    (body as Record<string, unknown>).leaderPin === ''
  ) {
    return NextResponse.json(
      { error: 'leaderPin is required' },
      { status: 400 },
    )
  }

  const {
    leaderPin,
    boardSize = 25,
    templateCount = 5,
  } = body as {
    leaderPin: string
    boardSize?: number
    templateCount?: number
  }

  if (typeof boardSize !== 'number' || boardSize < 9 || boardSize > 25) {
    return NextResponse.json(
      { error: 'boardSize must be between 9 and 25' },
      { status: 400 },
    )
  }

  if (
    typeof templateCount !== 'number' ||
    templateCount < 0 ||
    templateCount > 10
  ) {
    return NextResponse.json(
      { error: 'templateCount must be between 0 and 10' },
      { status: 400 },
    )
  }

  if (templateCount > boardSize) {
    return NextResponse.json(
      { error: 'templateCount must not exceed boardSize' },
      { status: 400 },
    )
  }

  let pin: string | null = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generatePin()
    const existing = await prisma.game.findFirst({
      where: {
        pin: candidate,
        status: { not: 'ended' },
      },
    })
    if (!existing) {
      pin = candidate
      break
    }
  }

  if (!pin) {
    return NextResponse.json(
      { error: 'Failed to generate unique PIN' },
      { status: 500 },
    )
  }

  const game = await prisma.game.create({
    data: {
      pin,
      leaderPin,
      boardSize,
      templateCount,
      status: 'lobby',
      round: 1,
    },
  })

  return NextResponse.json(
    {
      gameId: game.id,
      pin: game.pin,
      leaderPin: game.leaderPin,
      status: game.status,
      boardSize: game.boardSize,
      templateCount: game.templateCount,
    },
    { status: 201 },
  )
}

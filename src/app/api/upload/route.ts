import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getPresignedUploadUrl } from '@/lib/s3'

export async function POST(request: Request) {
  const body: unknown = await request.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('gameId' in body) ||
    !('teamId' in body) ||
    !('roundItemId' in body) ||
    !('contentType' in body) ||
    typeof (body as Record<string, unknown>).gameId !== 'string' ||
    typeof (body as Record<string, unknown>).teamId !== 'string' ||
    typeof (body as Record<string, unknown>).roundItemId !== 'string' ||
    typeof (body as Record<string, unknown>).contentType !== 'string' ||
    !(body as Record<string, unknown>).gameId ||
    !(body as Record<string, unknown>).teamId ||
    !(body as Record<string, unknown>).roundItemId ||
    !(body as Record<string, unknown>).contentType
  ) {
    return NextResponse.json(
      { error: 'gameId, teamId, roundItemId, and contentType are required' },
      { status: 400 },
    )
  }

  const { gameId, teamId, contentType } = body as {
    gameId: string
    teamId: string
    roundItemId: string
    contentType: string
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } })

  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  const { uploadUrl, photoUrl } = await getPresignedUploadUrl(
    gameId,
    contentType,
  )

  return NextResponse.json({ uploadUrl, photoUrl })
}

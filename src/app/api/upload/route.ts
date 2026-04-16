import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getPresignedUploadUrl } from '@/lib/s3'
import { verifySessionToken } from '@/lib/session-token'

export async function POST(request: Request) {
  const body: unknown = await request.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('gameId' in body) ||
    !('teamId' in body) ||
    !('roundItemId' in body) ||
    !('contentType' in body) ||
    !('sessionToken' in body) ||
    typeof (body as Record<string, unknown>).gameId !== 'string' ||
    typeof (body as Record<string, unknown>).teamId !== 'string' ||
    typeof (body as Record<string, unknown>).roundItemId !== 'string' ||
    typeof (body as Record<string, unknown>).contentType !== 'string' ||
    typeof (body as Record<string, unknown>).sessionToken !== 'string' ||
    !(body as Record<string, unknown>).gameId ||
    !(body as Record<string, unknown>).teamId ||
    !(body as Record<string, unknown>).roundItemId ||
    !(body as Record<string, unknown>).contentType ||
    !(body as Record<string, unknown>).sessionToken
  ) {
    return NextResponse.json(
      {
        error:
          'gameId, teamId, roundItemId, contentType, and sessionToken are required',
      },
      { status: 400 },
    )
  }

  const { gameId, teamId, roundItemId, contentType, sessionToken } = body as {
    gameId: string
    teamId: string
    roundItemId: string
    contentType: string
    sessionToken: string
  }

  if (contentType !== 'image/webp') {
    return NextResponse.json(
      { error: 'Unsupported contentType' },
      { status: 400 },
    )
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } })

  if (!team || team.gameId !== gameId) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  if (
    team.sessionTokenHash === null ||
    !verifySessionToken(sessionToken, team.sessionTokenHash)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { uploadUrl, photoUrl, key } = await getPresignedUploadUrl(
    gameId,
    contentType,
  )

  await prisma.pendingUpload.create({
    data: {
      gameId,
      teamId,
      roundItemId,
      photoKey: key,
      photoUrl,
    },
  })

  return NextResponse.json({ uploadUrl, photoUrl })
}

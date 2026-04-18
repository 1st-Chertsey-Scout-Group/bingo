import { NextResponse } from 'next/server'

import { badRequest, notFound, unauthorizedResponse } from '@/lib/admin'
import type { UploadRequest, UploadResponse } from '@/lib/api-types'
import { parseBody } from '@/lib/api-validation'
import { prisma } from '@/lib/prisma'
import { getPresignedUploadUrl } from '@/lib/s3'
import { verifySessionToken } from '@/lib/session-token'

export async function POST(request: Request) {
  const parsed = parseBody<UploadRequest>(await request.json(), [
    'gameId',
    'teamId',
    'roundItemId',
    'contentType',
    'sessionToken',
  ])
  if (!parsed.ok) return parsed.response
  const { gameId, teamId, roundItemId, contentType, sessionToken } = parsed.data

  if (contentType !== 'image/webp') {
    return badRequest('Unsupported contentType')
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } })

  if (!game) {
    return notFound('Game not found')
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } })

  if (!team || team.gameId !== gameId) {
    return notFound('Team not found')
  }

  if (
    team.sessionTokenHash === null ||
    !verifySessionToken(sessionToken, team.sessionTokenHash)
  ) {
    return unauthorizedResponse()
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

  return NextResponse.json<UploadResponse>({ uploadUrl, photoUrl })
}

import { NextResponse } from 'next/server'

import {
  checkAdminPin,
  conflict,
  notFound,
  unauthorizedResponse,
} from '@/lib/admin'
import type { ItemResponse, UpdateItemRequest } from '@/lib/api-types'
import { parseBody } from '@/lib/api-validation'
import { GAME_STATUS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const { itemId } = await params

  const parsed = parseBody<UpdateItemRequest>(await request.json(), ['name'])
  if (!parsed.ok) return parsed.response
  const { name } = parsed.data

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
  })

  if (!existing) {
    return notFound('Item not found')
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: { name: name.trim() },
  })

  return NextResponse.json<ItemResponse>({
    id: item.id,
    name: item.name,
    isDefault: item.isDefault,
    isTemplate: item.isTemplate,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const { itemId } = await params

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
  })

  if (!existing) {
    return notFound('Item not found')
  }

  const activeRoundItem = await prisma.roundItem.findFirst({
    where: {
      itemId,
      game: {
        status: GAME_STATUS.ACTIVE,
      },
    },
  })

  if (activeRoundItem) {
    return conflict('Cannot delete item that is in use in an active round')
  }

  await prisma.item.delete({
    where: { id: itemId },
  })

  return new NextResponse(null, { status: 204 })
}

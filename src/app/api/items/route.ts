import { NextResponse } from 'next/server'

import { checkAdminPin, unauthorizedResponse } from '@/lib/admin'
import type {
  CreateItemRequest,
  ItemListResponse,
  ItemResponse,
} from '@/lib/api-types'
import { parseBody } from '@/lib/api-validation'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, isDefault: true, isTemplate: true },
  })

  return NextResponse.json<ItemListResponse>({ items })
}

export async function POST(request: Request) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const parsed = parseBody<CreateItemRequest>(await request.json(), ['name'])
  if (!parsed.ok) return parsed.response
  const { name } = parsed.data

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      isDefault: false,
      isTemplate: false,
    },
  })

  return NextResponse.json<ItemResponse>(
    {
      id: item.id,
      name: item.name,
      isDefault: item.isDefault,
      isTemplate: item.isTemplate,
    },
    { status: 201 },
  )
}

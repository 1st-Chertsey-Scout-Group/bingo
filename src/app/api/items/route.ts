import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const adminPin = request.headers.get('x-admin-pin')
  if (!adminPin || adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, isTemplate: true },
  })

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const adminPin = request.headers.get('x-admin-pin')
  if (!adminPin || adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json()

  if (
    typeof body !== 'object' ||
    body === null ||
    !('name' in body) ||
    typeof (body as Record<string, unknown>).name !== 'string' ||
    (body as Record<string, unknown>).name === '' ||
    ((body as Record<string, unknown>).name as string).trim() === ''
  ) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name } = body as { name: string }

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      isDefault: false,
      isTemplate: false,
    },
  })

  return NextResponse.json(
    {
      id: item.id,
      name: item.name,
      isDefault: item.isDefault,
      isTemplate: item.isTemplate,
    },
    { status: 201 },
  )
}

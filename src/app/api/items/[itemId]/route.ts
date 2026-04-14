import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const adminPin = request.headers.get('x-admin-pin')
  if (!adminPin || adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await params

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

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: { name: name.trim() },
  })

  return NextResponse.json({
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
  const adminPin = request.headers.get('x-admin-pin')
  if (!adminPin || adminPin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await params

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const activeRoundItem = await prisma.roundItem.findFirst({
    where: {
      itemId,
      game: {
        status: 'active',
      },
    },
  })

  if (activeRoundItem) {
    return NextResponse.json(
      { error: 'Cannot delete item that is in use in an active round' },
      { status: 409 },
    )
  }

  await prisma.item.delete({
    where: { id: itemId },
  })

  return new NextResponse(null, { status: 204 })
}

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

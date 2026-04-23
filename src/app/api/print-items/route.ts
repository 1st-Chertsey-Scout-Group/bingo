import { NextResponse } from 'next/server'

import { checkAdminPin, unauthorizedResponse } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export type PrintItem = {
  name: string
  category: string
}

export type PrintItemsResponse = {
  items: PrintItem[]
}

export async function GET(request: Request) {
  if (!checkAdminPin(request.headers)) {
    return unauthorizedResponse()
  }

  const [concreteItems, templateItems, templateValues] = await Promise.all([
    prisma.item.findMany({
      where: { isTemplate: false },
      orderBy: { name: 'asc' },
      select: { name: true, category: true },
    }),
    prisma.item.findMany({
      where: { isTemplate: true },
      select: { name: true },
    }),
    prisma.templateValue.findMany({
      orderBy: [{ category: 'asc' }, { value: 'asc' }],
    }),
  ])

  const items: PrintItem[] = concreteItems.map((i) => ({
    name: i.name,
    category: i.category,
  }))

  for (const template of templateItems) {
    const match = /\[(\w+)]/.exec(template.name)
    if (!match) continue
    const templateCategory = match[1]!
    const values = templateValues.filter(
      (tv) => tv.category === templateCategory,
    )
    for (const tv of values) {
      items.push({
        name: template.name.replace(`[${templateCategory}]`, tv.value),
        category: 'templates',
      })
    }
  }

  return NextResponse.json<PrintItemsResponse>({ items })
}

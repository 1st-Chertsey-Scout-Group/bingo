import { notFound } from 'next/navigation'

import { prisma } from '@/lib/prisma'

type ScoutPageProps = {
  params: Promise<{ gameId: string }>
}

export default async function ScoutPage({ params }: ScoutPageProps) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true },
  })

  if (!game) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="text-lg">Scout View - {gameId}</p>
    </div>
  )
}

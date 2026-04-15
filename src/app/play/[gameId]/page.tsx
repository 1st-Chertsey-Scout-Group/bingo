import { notFound } from 'next/navigation'

import { ScoutGame } from '@/components/ScoutGame'
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

  return <ScoutGame gameId={gameId} />
}

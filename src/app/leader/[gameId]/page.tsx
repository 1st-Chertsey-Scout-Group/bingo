import { notFound } from 'next/navigation'

import { prisma } from '@/lib/prisma'

type LeaderPageProps = {
  params: Promise<{ gameId: string }>
}

export default async function LeaderPage({ params }: LeaderPageProps) {
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
      <p className="text-lg">Leader View - {gameId}</p>
    </div>
  )
}

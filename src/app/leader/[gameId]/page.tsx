import { notFound } from 'next/navigation'

import { LeaderGame } from '@/components/LeaderGame'
import { prisma } from '@/lib/prisma'

type LeaderPageProps = {
  params: Promise<{ gameId: string }>
}

export default async function LeaderPage({ params }: LeaderPageProps) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, pin: true, leaderPin: true },
  })

  if (!game) {
    notFound()
  }

  return <LeaderGame gamePin={game.pin} leaderPin={game.leaderPin} />
}

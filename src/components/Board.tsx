'use client'

import { Square } from '@/components/Square'
import type { RoundItem } from '@/types'

type BoardProps = {
  items: RoundItem[]
  role: 'scout' | 'leader'
  myTeamId: string | null
  onSquareTap: (roundItemId: string) => void
}

export function Board({ items, role, myTeamId, onSquareTap }: BoardProps) {
  return (
    <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-2">
      {items.map((item) => (
        <Square
          key={item.roundItemId}
          roundItem={item}
          role={role}
          isOwnTeam={item.claimedByTeamId === myTeamId}
          onTap={() => onSquareTap(item.roundItemId)}
        />
      ))}
    </div>
  )
}

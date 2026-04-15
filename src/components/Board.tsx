'use client'

import { Square } from '@/components/Square'
import type { RoundItem } from '@/types'

type BoardProps = {
  items: RoundItem[]
  role: 'scout' | 'leader'
  myTeamId: string | null
  pendingItems?: Set<string>
  onSquareTap: (roundItemId: string) => void
}

export function Board({
  items,
  role,
  myTeamId,
  pendingItems,
  onSquareTap,
}: BoardProps) {
  return (
    <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-2">
      {items.map((item) => (
        <Square
          key={item.roundItemId}
          roundItem={item}
          role={role}
          isOwnTeam={item.claimedByTeamId === myTeamId}
          isPending={pendingItems?.has(item.roundItemId) ?? false}
          onTap={() => onSquareTap(item.roundItemId)}
        />
      ))}
    </div>
  )
}

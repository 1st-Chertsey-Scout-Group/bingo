'use client'

import { memo } from 'react'

import { Square } from '@/components/Square'
import type { RoundItem } from '@/types'

type BoardProps = {
  items: RoundItem[]
  role: 'scout' | 'leader'
  myTeamId: string | null
  pendingItems?: Set<string>
  failedItemId?: string | null
  onSquareTap: (roundItemId: string) => void
}

export const Board = memo(function Board({
  items,
  role,
  myTeamId,
  pendingItems,
  failedItemId,
  onSquareTap,
}: BoardProps) {
  return (
    <div
      className="grid flex-1 grid-cols-3 content-start gap-2.5 overflow-y-auto bg-gray-50/60 p-3"
      aria-label="Bingo board"
      role="grid"
    >
      {items.map((item) => (
        <Square
          key={item.roundItemId}
          roundItem={item}
          role={role}
          isOwnTeam={item.claimedByTeamId === myTeamId}
          isPending={pendingItems?.has(item.roundItemId) ?? false}
          isFailed={item.roundItemId === failedItemId}
          onTap={() => onSquareTap(item.roundItemId)}
        />
      ))}
    </div>
  )
})

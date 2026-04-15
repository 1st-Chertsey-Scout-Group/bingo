'use client'

import type { RoundItem } from '@/types'

type SquareProps = {
  roundItem: RoundItem
  role: 'scout' | 'leader'
  isOwnTeam: boolean
  onTap: () => void
}

export function Square({ roundItem, onTap }: SquareProps) {
  return (
    <button
      onClick={onTap}
      className="flex aspect-square items-center justify-center rounded-lg border border-gray-200 bg-white p-1 text-center text-xs font-medium transition-colors"
    >
      <span className="line-clamp-3 break-words">{roundItem.displayName}</span>
    </button>
  )
}

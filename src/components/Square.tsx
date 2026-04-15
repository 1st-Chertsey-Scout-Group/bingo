'use client'

import { cn } from '@/lib/utils'
import type { RoundItem } from '@/types'

type SquareProps = {
  roundItem: RoundItem
  role: 'scout' | 'leader'
  isOwnTeam: boolean
  onTap: () => void
}

const baseClasses =
  'aspect-square flex items-center justify-center rounded-lg p-1 text-center text-xs font-medium transition-colors'

const unclaimedClasses =
  'bg-white border border-gray-200 text-gray-900 active:bg-gray-50 cursor-pointer'

export function Square({ roundItem, onTap }: SquareProps) {
  const isUnclaimed = roundItem.claimedByTeamId === null

  return (
    <button
      onClick={onTap}
      className={cn(baseClasses, isUnclaimed && unclaimedClasses)}
    >
      <span className="line-clamp-3 break-words">{roundItem.displayName}</span>
    </button>
  )
}

'use client'

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { RoundItem } from '@/types'

type SquareProps = {
  roundItem: RoundItem
  role: 'scout' | 'leader'
  isOwnTeam: boolean
  onTap: () => void
}

const baseClasses =
  'aspect-square flex items-center justify-center rounded-lg p-1 text-center text-xs font-medium transition-colors relative'

const unclaimedClasses =
  'bg-white border border-gray-200 text-gray-900 active:bg-gray-50 cursor-pointer'

const ownTeamClaimedClasses = 'border-0 text-white cursor-default'

export function Square({ roundItem, isOwnTeam, onTap }: SquareProps) {
  const isUnclaimed = roundItem.claimedByTeamId === null
  const isOwnTeamClaimed = isOwnTeam && !isUnclaimed

  return (
    <button
      onClick={onTap}
      className={cn(
        baseClasses,
        isUnclaimed && unclaimedClasses,
        isOwnTeamClaimed && ownTeamClaimedClasses,
      )}
      style={
        isOwnTeamClaimed
          ? { backgroundColor: roundItem.claimedByTeamColour ?? undefined }
          : undefined
      }
    >
      {isOwnTeamClaimed && (
        <Check className="absolute top-1 right-1 h-4 w-4 text-white" />
      )}
      <span className="line-clamp-3 break-words">{roundItem.displayName}</span>
    </button>
  )
}

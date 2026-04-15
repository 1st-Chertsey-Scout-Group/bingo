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

const claimedClasses = 'border-0 text-white cursor-default'

function getTeamAbbreviation(name: string): string {
  const parts = name.split(' ')
  if (parts.length < 2 || !parts[1]) return name
  return `${parts[0]} ${parts[1][0]}.`
}

export function Square({ roundItem, isOwnTeam, onTap }: SquareProps) {
  const isUnclaimed = roundItem.claimedByTeamId === null
  const isClaimed = !isUnclaimed
  const isOwnTeamClaimed = isOwnTeam && isClaimed
  const isOtherTeamClaimed = !isOwnTeam && isClaimed

  return (
    <button
      onClick={onTap}
      className={cn(
        baseClasses,
        isUnclaimed && unclaimedClasses,
        isClaimed && claimedClasses,
      )}
      style={
        isClaimed
          ? {
              backgroundColor: roundItem.claimedByTeamColour ?? undefined,
              opacity: isOtherTeamClaimed ? 0.7 : undefined,
            }
          : undefined
      }
    >
      {isOwnTeamClaimed && (
        <Check className="absolute top-1 right-1 h-4 w-4 text-white" />
      )}
      {isOtherTeamClaimed && roundItem.claimedByTeamName && (
        <span className="absolute right-1 bottom-1 text-[10px] font-bold">
          {getTeamAbbreviation(roundItem.claimedByTeamName)}
        </span>
      )}
      <span className="line-clamp-3 break-words">{roundItem.displayName}</span>
    </button>
  )
}

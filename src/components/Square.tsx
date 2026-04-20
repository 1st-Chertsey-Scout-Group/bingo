'use client'

import { memo } from 'react'
import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { RoundItem } from '@/types'

type SquareProps = {
  roundItem: RoundItem
  role: 'scout' | 'leader'
  isOwnTeam: boolean
  isPending?: boolean
  isFailed?: boolean
  onTap: () => void
}

const baseClasses =
  'aspect-square flex items-center justify-center rounded-xl p-1.5 text-center text-base font-semibold transition-all duration-200 relative'

const unclaimedClasses =
  'bg-white border-2 border-gray-200 text-gray-800 shadow-sm active:scale-95 cursor-pointer hover:shadow-md'

const pendingClasses =
  'bg-amber-50 border-2 border-dashed border-amber-400 text-gray-800 animate-pulse cursor-default pointer-events-none shadow-sm'

const needsReviewClasses =
  'bg-amber-50 border-2 border-amber-500 text-gray-800 animate-pulse-amber cursor-pointer shadow-md'

const lockedClasses =
  'bg-gray-100 border-2 border-gray-300 text-gray-400 opacity-60 cursor-default pointer-events-none'

const failedClasses =
  'bg-red-50 border-2 border-red-400 text-red-600 shadow-sm cursor-pointer'

const claimedClasses =
  'border-0 text-white shadow-md cursor-default flex-col justify-between p-2'

export const Square = memo(function Square({
  roundItem,
  role,
  isOwnTeam,
  isPending = false,
  isFailed = false,
  onTap,
}: SquareProps) {
  const isUnclaimed = roundItem.claimedByTeamId === null
  const isClaimed = !isUnclaimed
  const isOwnTeamClaimed = isOwnTeam && isClaimed
  const isOtherTeamClaimed = !isOwnTeam && isClaimed
  const isLocked =
    role === 'leader' && isUnclaimed && roundItem.lockedByLeader !== null
  const needsReview =
    role === 'leader' &&
    roundItem.hasPendingSubmissions &&
    isUnclaimed &&
    roundItem.lockedByLeader === null

  const ariaLabel = isClaimed
    ? `${roundItem.displayName} — claimed by ${roundItem.claimedByTeamName ?? 'unknown'}`
    : isFailed
      ? `${roundItem.displayName} — tap to retry`
      : isPending
        ? `${roundItem.displayName} — pending review`
        : roundItem.displayName

  return (
    <button
      onClick={onTap}
      aria-label={ariaLabel}
      className={cn(
        baseClasses,
        isUnclaimed &&
          !isPending &&
          !needsReview &&
          !isLocked &&
          !isFailed &&
          unclaimedClasses,
        isUnclaimed &&
          isPending &&
          !needsReview &&
          !isLocked &&
          !isFailed &&
          pendingClasses,
        needsReview && needsReviewClasses,
        isLocked && lockedClasses,
        isFailed && failedClasses,
        isClaimed && claimedClasses,
      )}
      style={
        isClaimed
          ? {
              backgroundColor: roundItem.claimedByTeamColour ?? undefined,
              opacity: role === 'scout' && isOtherTeamClaimed ? 0.7 : undefined,
            }
          : undefined
      }
    >
      {isClaimed ? (
        <>
          <span />
          <div className="flex flex-col items-center gap-0.5">
            {role === 'scout' &&
              (isOwnTeamClaimed ? (
                <Check
                  className="h-7 w-7 shrink-0 text-white"
                  strokeWidth={3}
                />
              ) : (
                <X className="h-7 w-7 shrink-0 text-white" strokeWidth={3} />
              ))}
            <span className="line-clamp-2 text-sm leading-tight font-semibold break-words">
              {roundItem.displayName}
            </span>
          </div>
          <span className="line-clamp-1 text-xs font-bold opacity-80">
            {roundItem.claimedByTeamName}
          </span>
        </>
      ) : (
        <>
          {isLocked && roundItem.lockedByLeader && (
            <span className="absolute right-1 bottom-1 text-sm font-semibold text-gray-400">
              {roundItem.lockedByLeader}
            </span>
          )}
          {isFailed ? (
            <span className="text-sm leading-tight">
              Photo didn&apos;t send — tap to try again
            </span>
          ) : (
            <span className="line-clamp-3 text-sm leading-tight break-words">
              {roundItem.displayName}
            </span>
          )}
        </>
      )}
    </button>
  )
})

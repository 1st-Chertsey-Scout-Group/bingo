'use client'

import { useMemo } from 'react'

import { ConnectionDot } from '@/components/ConnectionDot'
import { useElapsedTime } from '@/hooks/useElapsedTime'
import { formatElapsed } from '@/lib/format'
import type { RoundItem, Team } from '@/types'

type ScoutHeaderProps = {
  roundStartedAt: string
  board: RoundItem[]
  myTeamId: string | null
  myTeamColour: string | null
  teams: Team[]
}

export function ScoutHeader({
  roundStartedAt,
  board,
  myTeamId,
  myTeamColour,
  teams,
}: ScoutHeaderProps) {
  const elapsed = useElapsedTime(roundStartedAt)

  const total = board.length
  const claimed = board.filter((item) => item.claimedByTeamId !== null).length
  const remaining = total - claimed
  const ours = board.filter((item) => item.claimedByTeamId === myTeamId).length

  // Build a count per team, then sort descending to find position
  const position = useMemo(() => {
    const countByTeam = new Map<string, number>()
    for (const team of teams) {
      countByTeam.set(team.id, 0)
    }
    for (const item of board) {
      if (item.claimedByTeamId !== null) {
        countByTeam.set(
          item.claimedByTeamId,
          (countByTeam.get(item.claimedByTeamId) ?? 0) + 1,
        )
      }
    }
    const sorted = [...countByTeam.entries()].sort((a, b) => b[1] - a[1])
    return myTeamId ? sorted.findIndex(([id]) => id === myTeamId) + 1 : 0
  }, [teams, board, myTeamId])

  const positionSuffix = (n: number): string => {
    if (n === 0) return ''
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 13) return `${String(n)}th`
    if (mod10 === 1) return `${String(n)}st`
    if (mod10 === 2) return `${String(n)}nd`
    if (mod10 === 3) return `${String(n)}rd`
    return `${String(n)}th`
  }

  return (
    <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <ConnectionDot />
        <span className="font-mono text-sm font-bold">
          {formatElapsed(elapsed)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm font-medium">
        <span className="text-muted-foreground">{remaining} left</span>
        <span
          className="rounded-full px-2.5 py-0.5 font-bold text-white"
          style={{ backgroundColor: myTeamColour ?? undefined }}
        >
          {ours}
        </span>
      </div>

      {position > 0 && (
        <span className="bg-muted rounded-full px-2.5 py-0.5 text-sm font-bold">
          {positionSuffix(position)}
        </span>
      )}
    </div>
  )
}

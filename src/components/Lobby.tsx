'use client'

import { useState, useEffect } from 'react'

import { LeaderBoardPreview } from '@/components/LeaderBoardPreview'
import { LeaderLobbyConfig } from '@/components/LeaderLobbyConfig'
import { ScoutLobby } from '@/components/ScoutLobby'
import { BOARD_CONFIG } from '@/lib/constants'
import type { BoardItem, Team } from '@/types'

type LobbyProps = {
  myTeam: { name: string; colour: string } | null
  teams: Team[]
  role: 'scout' | 'leader'
  teamsLocked?: boolean
  gamePin?: string
  leaderPin?: string
  previewBoard?: BoardItem[] | null
  onPreviewBoard?: (
    categories: string[],
    boardSize: number,
    templateCount: number,
  ) => void
  onRefreshItem?: (index: number, categories: string[]) => void
  onStartRound?: () => void
  onClearPreview?: () => void
  onSwitchTeam?: (teamName: string) => void
  onToggleTeamLock?: (locked: boolean) => void
  onEndGame?: () => void
}

export function Lobby({
  myTeam,
  teams,
  role,
  teamsLocked,
  gamePin,
  leaderPin,
  previewBoard,
  onPreviewBoard,
  onRefreshItem,
  onStartRound,
  onClearPreview,
  onSwitchTeam,
  onToggleTeamLock,
  onEndGame,
}: LobbyProps) {
  const [isLandscape, setIsLandscape] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(orientation: landscape)').matches,
  )
  const [host] = useState(() =>
    typeof window !== 'undefined' ? window.location.host : '',
  )

  // Last-used config for regeneration in preview phase
  const [lastConfig, setLastConfig] = useState<{
    categories: string[]
    boardSize: number
    templateCount: number
  }>({
    categories: [],
    boardSize: BOARD_CONFIG.SIZE_DEFAULT,
    templateCount: BOARD_CONFIG.TEMPLATE_DEFAULT,
  })

  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (isLandscape && role === 'leader') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        onClick={() => setIsLandscape(false)}
      >
        <p className="text-4xl font-bold">{host}</p>
        <p className="font-mono text-[20vw] leading-none font-bold">
          {gamePin}
        </p>
        <p className="text-muted-foreground text-sm">
          Rotate to portrait to return
        </p>
      </div>
    )
  }

  if (role === 'scout') {
    return (
      <ScoutLobby
        myTeam={myTeam}
        teams={teams}
        teamsLocked={teamsLocked}
        onSwitchTeam={onSwitchTeam}
      />
    )
  }

  if (previewBoard) {
    return (
      <LeaderBoardPreview
        previewBoard={previewBoard}
        teamCount={teams.length}
        enabledCategories={lastConfig.categories}
        onRefreshItem={onRefreshItem}
        onRegenerate={() => {
          onPreviewBoard?.(
            lastConfig.categories,
            lastConfig.boardSize,
            lastConfig.templateCount,
          )
        }}
        onClearPreview={onClearPreview}
        onStartRound={onStartRound}
      />
    )
  }

  return (
    <LeaderLobbyConfig
      teams={teams}
      teamsLocked={teamsLocked}
      gamePin={gamePin}
      leaderPin={leaderPin}
      onPreviewBoard={(categories, boardSize, templateCount) => {
        setLastConfig({ categories, boardSize, templateCount })
        onPreviewBoard?.(categories, boardSize, templateCount)
      }}
      onToggleTeamLock={onToggleTeamLock}
      onEndGame={onEndGame}
    />
  )
}

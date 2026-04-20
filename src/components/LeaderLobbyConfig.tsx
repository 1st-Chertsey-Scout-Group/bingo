'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TeamBadge } from '@/components/TeamBadge'
import {
  ALL_CATEGORIES,
  BOARD_CONFIG,
  ITEM_CATEGORY_LABELS,
  type ItemCategory,
} from '@/lib/constants'
import type { Team } from '@/types'

type LeaderLobbyConfigProps = {
  teams: Team[]
  teamsLocked?: boolean
  gamePin?: string
  leaderPin?: string
  onPreviewBoard?: (
    categories: string[],
    boardSize: number,
    templateCount: number,
  ) => void
  onToggleTeamLock?: (locked: boolean) => void
  onEndGame?: () => void
}

export function LeaderLobbyConfig({
  teams,
  teamsLocked,
  gamePin,
  leaderPin,
  onPreviewBoard,
  onToggleTeamLock,
  onEndGame,
}: LeaderLobbyConfigProps) {
  const [categories, setCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const cat of ALL_CATEGORIES) {
      initial[cat] = true
    }
    return initial
  })
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [boardSize, setBoardSize] = useState<number>(BOARD_CONFIG.SIZE_DEFAULT)
  const [templateCount, setTemplateCount] = useState<number>(
    BOARD_CONFIG.TEMPLATE_DEFAULT,
  )

  const templateMax = Math.min(BOARD_CONFIG.TEMPLATE_MAX, boardSize)
  const clampedTemplateCount = Math.min(templateCount, templateMax)

  const enabledCategories = Object.entries(categories)
    .filter(([, enabled]) => enabled)
    .map(([cat]) => cat)

  const toggleCategory = (cat: string) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handlePreview = () => {
    onPreviewBoard?.(enabledCategories, boardSize, clampedTemplateCount)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex justify-center gap-4">
        <div className="bg-muted rounded-2xl p-4 text-center shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Scout PIN</p>
          <p className="font-mono text-4xl font-bold">{gamePin}</p>
        </div>
        <div className="bg-muted rounded-2xl p-4 text-center shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">
            Leader PIN
          </p>
          <p className="font-mono text-4xl font-bold">{leaderPin}</p>
        </div>
      </div>

      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Teams Joined ({teams.length})
          </h2>
          <Button
            variant={teamsLocked ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleTeamLock?.(!teamsLocked)}
          >
            {teamsLocked ? 'Unlock Teams' : 'Lock Teams'}
          </Button>
        </div>
        {teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <TeamBadge key={team.id} name={team.name} colour={team.colour} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Waiting for scouts to join...</p>
        )}
      </div>

      <div className="w-full">
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={categories[cat] ? 'default' : 'outline'}
              size="sm"
              className="h-10 text-xs"
              onClick={() => toggleCategory(cat)}
            >
              {ITEM_CATEGORY_LABELS[cat as ItemCategory]}
            </Button>
          ))}
        </div>
        {enabledCategories.length === 0 && (
          <p className="text-destructive mt-2 text-sm">
            Select at least one category
          </p>
        )}
      </div>

      <div className="w-full space-y-4">
        <div>
          <Label>
            Board Size: <span className="font-bold">{boardSize}</span>
          </Label>
          <input
            type="range"
            min={BOARD_CONFIG.SIZE_MIN}
            max={BOARD_CONFIG.SIZE_MAX}
            step={BOARD_CONFIG.SIZE_STEP}
            value={boardSize}
            onChange={(e) => setBoardSize(Number(e.target.value))}
            aria-label={`Board size: ${String(boardSize)}`}
            className="h-10 w-full"
          />
        </div>
        <div>
          <Label>
            Template Count:{' '}
            <span className="font-bold">{clampedTemplateCount}</span>
          </Label>
          <input
            type="range"
            min={BOARD_CONFIG.TEMPLATE_MIN}
            max={templateMax}
            value={clampedTemplateCount}
            onChange={(e) => setTemplateCount(Number(e.target.value))}
            aria-label={`Template count: ${String(clampedTemplateCount)}`}
            className="h-10 w-full"
          />
        </div>
      </div>

      <Button
        size="lg"
        className="h-14 w-full text-lg"
        disabled={teams.length < 1 || enabledCategories.length === 0}
        onClick={handlePreview}
      >
        Preview Board
      </Button>
      {teams.length < 1 && (
        <p className="text-muted-foreground text-sm">
          Need at least 1 team to start
        </p>
      )}

      {onEndGame && (
        <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" className="text-destructive">
                End Game
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End this game?</DialogTitle>
              <DialogDescription>
                This will disconnect all scouts and end the game session.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setEndDialogOpen(false)
                  onEndGame()
                }}
              >
                End Game
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

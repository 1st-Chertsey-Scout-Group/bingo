'use client'

import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BoardItem } from '@/types'

type LeaderBoardPreviewProps = {
  previewBoard: BoardItem[]
  teamCount: number
  enabledCategories: string[]
  onRefreshItem?: (index: number, categories: string[]) => void
  onRegenerate: () => void
  onClearPreview?: () => void
  onStartRound?: () => void
}

export function LeaderBoardPreview({
  previewBoard,
  teamCount,
  enabledCategories,
  onRefreshItem,
  onRegenerate,
  onClearPreview,
  onStartRound,
}: LeaderBoardPreviewProps) {
  const cols = 3

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-lg font-semibold">Board Preview</h2>
      <p className="text-muted-foreground text-sm">Tap any square to swap it</p>

      <div
        className="grid w-full max-w-md gap-1.5"
        style={{ gridTemplateColumns: `repeat(${String(cols)}, 1fr)` }}
      >
        {previewBoard.map((item, index) => (
          <button
            key={`${String(index)}-${item.itemId}`}
            type="button"
            className="flex aspect-square items-center justify-center rounded-xl border bg-white p-1.5 text-center text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
            onClick={() => onRefreshItem?.(index, enabledCategories)}
          >
            {item.displayName}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button variant="outline" className="flex-1" onClick={onClearPreview}>
          Back
        </Button>
        <Button variant="outline" className="flex-1" onClick={onRegenerate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>

      <Button
        size="lg"
        className="h-14 w-full max-w-md text-lg"
        disabled={teamCount < 1}
        onClick={onStartRound}
      >
        Start Round
      </Button>
      {teamCount < 1 && (
        <p className="text-muted-foreground text-sm">
          Need at least 1 team to start
        </p>
      )}
    </div>
  )
}

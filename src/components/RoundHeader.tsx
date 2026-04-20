'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { ConnectionDot } from '@/components/ConnectionBanner'
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
import { useElapsedTime } from '@/hooks/useElapsedTime'
import { formatElapsed } from '@/lib/format'
import type { RoundItem } from '@/types'

type RoundHeaderProps = {
  roundStartedAt: string
  board: RoundItem[]
  onEndRound: () => void
  onToggleMap?: () => void
  mapOpen?: boolean
}

export function RoundHeader({
  roundStartedAt,
  board,
  onEndRound,
  onToggleMap,
  mapOpen,
}: RoundHeaderProps) {
  const elapsed = useElapsedTime(roundStartedAt)
  const [dialogOpen, setDialogOpen] = useState(false)

  const claimed = board.filter((item) => item.claimedByTeamId !== null).length
  const total = board.length

  const handleConfirmEnd = () => {
    setDialogOpen(false)
    onEndRound()
  }

  return (
    <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-bold">
          {formatElapsed(elapsed)}
        </span>
        <ConnectionDot />
      </div>

      <span className="bg-muted rounded-full px-3 py-0.5 text-sm font-bold">
        {claimed}/{total}
      </span>

      {onToggleMap && (
        <Button
          variant={mapOpen ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleMap}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button variant="destructive" size="sm">
              End Round
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this round?</DialogTitle>
            <DialogDescription>
              This will end the current round for all teams.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmEnd}>
              End Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

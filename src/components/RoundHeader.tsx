'use client'

import { useEffect, useState } from 'react'
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
import type { RoundItem } from '@/types'

type RoundHeaderProps = {
  roundStartedAt: string
  board: RoundItem[]
  onEndRound: () => void
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function RoundHeader({
  roundStartedAt,
  board,
  onEndRound,
}: RoundHeaderProps) {
  const [elapsed, setElapsed] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const startTime = new Date(roundStartedAt).getTime()

    const tick = () => {
      const now = Date.now()
      setElapsed(Math.floor((now - startTime) / 1000))
    }

    tick()
    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [roundStartedAt])

  const claimed = board.filter((item) => item.claimedByTeamId !== null).length
  const total = board.length

  const handleConfirmEnd = () => {
    setDialogOpen(false)
    onEndRound()
  }

  return (
    <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2 backdrop-blur">
      <span className="font-mono text-lg font-semibold">
        {formatElapsed(elapsed)}
      </span>

      <span className="text-muted-foreground text-sm font-medium">
        {claimed}/{total}
      </span>

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

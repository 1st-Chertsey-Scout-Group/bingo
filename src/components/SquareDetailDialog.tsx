'use client'

import { Camera } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type SquareDetailDialogProps = {
  displayName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTakePhoto: () => void
}

export function SquareDetailDialog({
  displayName,
  open,
  onOpenChange,
  onTakePhoto,
}: SquareDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              onOpenChange(false)
              onTakePhoto()
            }}
          >
            <Camera className="mr-2 h-5 w-5" />
            Take Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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

type SquareModalProps = {
  displayName: string
  open: boolean
  onClose: () => void
  onTakePhoto: () => void
}

export function SquareModal({
  displayName,
  open,
  onClose,
  onTakePhoto,
}: SquareModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug">
            {displayName}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={onTakePhoto}
          >
            <Camera className="size-5" data-icon="inline-start" />
            Take Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

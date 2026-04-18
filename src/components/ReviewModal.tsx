'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SubmissionForReview } from '@/types'

type ReviewModalProps = {
  submission: SubmissionForReview
  open: boolean
  onApprove: (submissionId: string) => void
  onReject: (submissionId: string) => void
  onDismiss: () => void
}

export function ReviewModal({
  submission,
  open,
  onApprove,
  onReject,
  onDismiss,
}: ReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent
        showCloseButton={true}
        className="flex h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col sm:max-w-[calc(100%-2rem)]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: submission.teamColour }}
            />
            <span className="text-lg">{submission.teamName}</span>
            <span className="text-muted-foreground mx-1">—</span>
            <span className="text-muted-foreground text-lg font-normal">
              {submission.displayName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.photoUrl}
            alt={submission.displayName}
            loading="lazy"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="h-14 flex-1 bg-red-600 text-lg text-white hover:bg-red-700"
            onClick={() => onReject(submission.submissionId)}
          >
            <XCircle className="mr-1.5 h-6 w-6" />
            Reject
          </Button>
          <Button
            className="h-14 flex-1 bg-green-600 text-lg text-white hover:bg-green-700"
            onClick={() => onApprove(submission.submissionId)}
          >
            <CheckCircle className="mr-1.5 h-6 w-6" />
            Approve
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

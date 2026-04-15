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
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: submission.teamColour }}
            />
            <span>{submission.teamName}</span>
            <span className="text-muted-foreground mx-1">—</span>
            <span className="text-muted-foreground font-normal">
              {submission.displayName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={submission.photoUrl}
            alt={submission.displayName}
            className="max-h-[60vh] w-full rounded-lg object-contain"
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="h-12 flex-1 bg-red-600 text-base text-white hover:bg-red-700"
            onClick={() => onReject(submission.submissionId)}
          >
            <XCircle className="mr-1 h-5 w-5" />
            Reject
          </Button>
          <Button
            className="h-12 flex-1 bg-green-600 text-base text-white hover:bg-green-700"
            onClick={() => onApprove(submission.submissionId)}
          >
            <CheckCircle className="mr-1 h-5 w-5" />
            Approve
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

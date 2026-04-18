'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UploadStage = 'compressing' | 'uploading' | 'submitting'

type UploadOverlayProps = {
  stage: UploadStage
  onCancel: () => void
}

const STAGE_LABELS: Record<UploadStage, string> = {
  compressing: 'Compressing photo...',
  uploading: 'Uploading...',
  submitting: 'Submitting...',
}

const STAGE_PROGRESS: Record<UploadStage, number> = {
  compressing: 20,
  uploading: 60,
  submitting: 90,
}

export function UploadOverlay({ stage, onCancel }: UploadOverlayProps) {
  const progress = STAGE_PROGRESS[stage]
  const label = STAGE_LABELS[stage]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-lg font-bold">{label}</p>

        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gray-800 transition-all duration-500"
            style={{ width: `${String(progress)}%` }}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

export type { UploadStage }

'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UploadStage = 'compressing' | 'uploading' | 'submitting'

type UploadOverlayProps = {
  stage: UploadStage
  progress: number
  onCancel: () => void
}

const STAGE_LABELS: Record<UploadStage, string> = {
  compressing: 'Compressing photo...',
  uploading: 'Uploading...',
  submitting: 'Submitting...',
}

export function UploadOverlay({
  stage,
  progress,
  onCancel,
}: UploadOverlayProps) {
  let percent: number
  if (stage === 'compressing') {
    percent = 0
  } else if (stage === 'uploading') {
    percent = Math.round(progress * 100)
  } else {
    percent = 100
  }

  const label =
    stage === 'uploading' && percent > 0
      ? `Uploading... ${String(percent)}%`
      : STAGE_LABELS[stage]

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
            className="h-full rounded-full bg-gray-800 transition-all duration-300"
            style={{ width: `${String(percent)}%` }}
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

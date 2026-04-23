'use client'

import {
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'

import type { UploadStage } from '@/components/UploadOverlay'
import type { UploadRequest, UploadResponse } from '@/lib/api-types'
import { SUBMISSION_STATUS } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { loadSession } from '@/lib/session'
import { uploadWithRetry } from '@/lib/upload'
import type { GameAction, RoundItem, SubmissionStatus } from '@/types'

type UsePhotoUploadOptions = {
  gameId: string
  teamId: string | undefined
  board: RoundItem[]
  mySubmissions: Map<string, SubmissionStatus>
  socket: Socket | null
  dispatch: Dispatch<GameAction>
}

type UsePhotoUploadReturn = {
  uploadStage: UploadStage | null
  uploadProgress: number
  failedUpload: { roundItemId: string; blob: Blob } | null
  pendingItems: Set<string>
  fileInputRef: RefObject<HTMLInputElement | null>
  handleFileSelected: (e: ChangeEvent<HTMLInputElement>) => void
  handleCancelUpload: () => void
  handleSquareTap: (roundItemId: string) => void
}

export function usePhotoUpload({
  gameId,
  teamId,
  board,
  mySubmissions,
  socket,
  dispatch,
}: UsePhotoUploadOptions): UsePhotoUploadReturn {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRoundItemIdRef = useRef<string | null>(null)
  const [failedUpload, setFailedUpload] = useState<{
    roundItemId: string
    blob: Blob
  } | null>(null)
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const doUpload = useCallback(
    async (blob: Blob, roundItemId: string) => {
      if (!teamId) return

      const session = loadSession()
      const sessionToken =
        session && session.role === 'scout' ? session.sessionToken : null
      if (!sessionToken) return

      const abort = new AbortController()
      abortRef.current = abort

      try {
        setUploadStage('uploading')
        setUploadProgress(0)

        if (abort.signal.aborted) return

        const getPresignedUrl = async () => {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId,
              teamId,
              roundItemId,
              contentType: 'image/webp',
              sessionToken,
            } satisfies UploadRequest),
            signal: abort.signal,
          })
          if (!res.ok) throw new Error('Failed to get upload URL')
          return (await res.json()) as UploadResponse
        }

        const result = await uploadWithRetry(
          blob,
          getPresignedUrl,
          (fraction) => setUploadProgress(fraction),
        )

        if (abort.signal.aborted) return

        if (result.success) {
          setUploadStage('submitting')
          setFailedUpload(null)
          socket?.emit('submission:submit', {
            roundItemId,
            photoUrl: result.photoUrl,
          })
          dispatch({ type: 'SUBMISSION_SENT', roundItemId })
        } else {
          setFailedUpload({ roundItemId, blob: result.blob })
        }
      } catch {
        if (!abort.signal.aborted) {
          toast('Upload failed')
        }
      } finally {
        setUploadStage(null)
        abortRef.current = null
      }
    },
    [gameId, teamId, socket, dispatch],
  )

  const handleFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const roundItemId = pendingRoundItemIdRef.current
      e.target.value = ''
      if (!file || !roundItemId) return
      pendingRoundItemIdRef.current = null

      // Clear any previous failed upload
      setFailedUpload(null)

      void (async () => {
        setUploadStage('compressing')

        let compressed: Blob
        try {
          compressed = await compressImage(file)
        } catch {
          setUploadStage(null)
          toast('Something went wrong. Try again.')
          return
        }

        await doUpload(compressed, roundItemId)
      })()
    },
    [doUpload],
  )

  const pendingItems = useMemo(
    () =>
      new Set(
        [...mySubmissions.entries()]
          .filter(([, status]) => status === SUBMISSION_STATUS.PENDING)
          .map(([roundItemId]) => roundItemId),
      ),
    [mySubmissions],
  )

  const handleCancelUpload = useCallback(() => {
    abortRef.current?.abort()
    setUploadStage(null)
    toast('Upload cancelled')
  }, [])

  const handleSquareTap = useCallback(
    (roundItemId: string) => {
      // Retry failed upload
      if (failedUpload && failedUpload.roundItemId === roundItemId) {
        setFailedUpload(null)
        void doUpload(failedUpload.blob, roundItemId)
        return
      }

      const item = board.find((i) => i.roundItemId === roundItemId)
      if (!item) return
      if (item.claimedByTeamId !== null) return
      if (pendingItems.has(roundItemId)) return
      pendingRoundItemIdRef.current = roundItemId
      fileInputRef.current?.click()
    },
    [board, pendingItems, failedUpload, doUpload],
  )

  return {
    uploadStage,
    uploadProgress,
    failedUpload,
    pendingItems,
    fileInputRef,
    handleFileSelected,
    handleCancelUpload,
    handleSquareTap,
  }
}

type GetPresignedUrl = () => Promise<{
  uploadUrl: string
  photoUrl: string
}>

type UploadResult =
  | { success: true; photoUrl: string }
  | { success: false; blob: Blob }

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const URL_EXPIRY_MS = 5 * 60 * 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function uploadWithRetry(
  blob: Blob,
  getPresignedUrl: GetPresignedUrl,
): Promise<UploadResult> {
  let uploadUrl: string | null = null
  let photoUrl: string | null = null
  let urlTimestamp = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Get a fresh presigned URL if we don't have one or it's expired
      if (
        !uploadUrl ||
        !photoUrl ||
        Date.now() - urlTimestamp > URL_EXPIRY_MS
      ) {
        const urls = await getPresignedUrl()
        uploadUrl = urls.uploadUrl
        photoUrl = urls.photoUrl
        urlTimestamp = Date.now()
      }

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/webp' },
      })

      if (!res.ok) {
        throw new Error(`Upload failed with status ${String(res.status)}`)
      }

      return { success: true, photoUrl }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      console.log(
        `Upload attempt ${String(attempt + 1)}/${String(MAX_RETRIES + 1)} failed: ${message}`,
      )

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt)
        await sleep(delay)
      }
    }
  }

  return { success: false, blob }
}

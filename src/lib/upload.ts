type GetPresignedUrl = () => Promise<{
  uploadUrl: string
  photoUrl: string
}>

type UploadResult =
  | { success: true; photoUrl: string }
  | { success: false; blob: Blob }

type OnProgress = (fraction: number) => void

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000
const URL_EXPIRY_MS = 5 * 60 * 1000
const FETCH_TIMEOUT_MS = 15_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function xhrUpload(
  url: string,
  blob: Blob,
  onProgress?: OnProgress,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timer = setTimeout(() => {
      xhr.abort()
      reject(new Error('Upload timed out'))
    }, FETCH_TIMEOUT_MS)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total)
      }
    })

    xhr.addEventListener('load', () => {
      clearTimeout(timer)
      resolve(xhr.status)
    })

    xhr.addEventListener('error', () => {
      clearTimeout(timer)
      reject(new Error('Upload network error'))
    })

    xhr.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('Upload aborted'))
    })

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'image/webp')
    xhr.send(blob)
  })
}

export async function uploadWithRetry(
  blob: Blob,
  getPresignedUrl: GetPresignedUrl,
  onProgress?: OnProgress,
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

      onProgress?.(0)

      const status = await xhrUpload(uploadUrl, blob, onProgress)

      // Status 0 is expected: S3 CORS may not expose the status code to XHR,
      // but the load event only fires on completed transfers (errors use the
      // error event), so 0 means the upload succeeded.
      if (status !== 0 && (status < 200 || status >= 300)) {
        throw new Error(`Upload failed with status ${String(status)}`)
      }

      onProgress?.(1)
      return { success: true, photoUrl }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      console.log(
        `Upload attempt ${String(attempt + 1)}/${String(MAX_RETRIES + 1)} failed: ${message}`,
      )

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt)
        await sleep(delay)
        onProgress?.(0)
      }
    }
  }

  return { success: false, blob }
}

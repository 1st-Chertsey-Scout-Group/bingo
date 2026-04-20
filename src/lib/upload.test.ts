import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { uploadWithRetry } from '@/lib/upload'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function makeBlob(): Blob {
  return new Blob(['test'], { type: 'image/webp' })
}

function makeGetPresignedUrl(
  uploadUrl = 'https://s3.example.com/upload',
  photoUrl = 'https://s3.example.com/photo.jpg',
) {
  return vi.fn().mockResolvedValue({ uploadUrl, photoUrl })
}

describe('uploadWithRetry', () => {
  it('returns success on first successful upload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const blob = makeBlob()
    const getUrl = makeGetPresignedUrl()

    const result = await uploadWithRetry(blob, getUrl)

    expect(result).toEqual({
      success: true,
      photoUrl: 'https://s3.example.com/photo.jpg',
    })
    expect(getUrl).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on fetch failure and succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const blob = makeBlob()
    const getUrl = makeGetPresignedUrl()

    const promise = uploadWithRetry(blob, getUrl)

    // Advance past the first retry delay (1000ms)
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toEqual({
      success: true,
      photoUrl: 'https://s3.example.com/photo.jpg',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns failure after all retries exhausted', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', fetchMock)

    const blob = makeBlob()
    const getUrl = makeGetPresignedUrl()

    const promise = uploadWithRetry(blob, getUrl)

    // Advance past all retry delays (1000 + 2000 + 4000)
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(2000)
    await vi.advanceTimersByTimeAsync(4000)

    const result = await promise

    expect(result).toEqual({ success: false, blob })
    expect(fetchMock).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
  })

  it('retries on non-ok response status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const blob = makeBlob()
    const getUrl = makeGetPresignedUrl()

    const promise = uploadWithRetry(blob, getUrl)
    await vi.advanceTimersByTimeAsync(1000)
    const result = await promise

    expect(result).toEqual({
      success: true,
      photoUrl: 'https://s3.example.com/photo.jpg',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('refreshes presigned URL when expired', async () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const getUrl = vi
      .fn()
      .mockResolvedValueOnce({
        uploadUrl: 'https://s3.example.com/old',
        photoUrl: 'https://s3.example.com/old-photo.jpg',
      })
      .mockResolvedValueOnce({
        uploadUrl: 'https://s3.example.com/new',
        photoUrl: 'https://s3.example.com/new-photo.jpg',
      })

    const blob = makeBlob()

    const promise = uploadWithRetry(blob, getUrl)

    // Let the first attempt fail, then advance time past URL expiry before the retry
    await vi.advanceTimersByTimeAsync(0) // let first attempt resolve/reject
    vi.setSystemTime(now + 6 * 60 * 1000) // expire the URL
    await vi.advanceTimersByTimeAsync(1000) // trigger retry delay

    const result = await promise

    expect(getUrl).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      success: true,
      photoUrl: 'https://s3.example.com/new-photo.jpg',
    })
  })

  it('reuses presigned URL across retries when not expired', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const getUrl = makeGetPresignedUrl()
    const blob = makeBlob()

    const promise = uploadWithRetry(blob, getUrl)
    await vi.advanceTimersByTimeAsync(1000)
    await promise

    expect(getUrl).toHaveBeenCalledTimes(1)
  })
})

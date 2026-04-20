import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = vi.fn().mockResolvedValue({})
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: class {},
    DeleteObjectsCommand: class {},
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://s3.example.com/signed'),
}))

vi.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'mock-cuid',
}))

import {
  getPhotoUrlPrefix,
  getPresignedUploadUrl,
  deleteObjects,
} from '@/lib/s3'

beforeEach(() => {
  vi.stubEnv('S3_REGION', 'us-east-1')
  vi.stubEnv('S3_ACCESS_KEY_ID', 'test-key')
  vi.stubEnv('S3_SECRET_ACCESS_KEY', 'test-secret')
  vi.stubEnv('S3_BUCKET', 'test-bucket')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getPhotoUrlPrefix', () => {
  it('returns the expected URL prefix', () => {
    const prefix = getPhotoUrlPrefix('g-1')
    expect(prefix).toBe(
      'https://test-bucket.s3.us-east-1.amazonaws.com/games/g-1/submissions/',
    )
  })

  it('uses custom endpoint when set', () => {
    vi.stubEnv('S3_ENDPOINT', 'http://localhost:9000')
    const prefix = getPhotoUrlPrefix('g-1')
    expect(prefix).toBe(
      'http://localhost:9000/test-bucket/games/g-1/submissions/',
    )
  })
})

describe('getPresignedUploadUrl', () => {
  it('returns uploadUrl, photoUrl, and key', async () => {
    const result = await getPresignedUploadUrl('g-1', 'image/webp')
    expect(result.uploadUrl).toBe('https://s3.example.com/signed')
    expect(result.photoUrl).toContain('games/g-1/submissions/mock-cuid.webp')
    expect(result.key).toBe('games/g-1/submissions/mock-cuid.webp')
  })
})

describe('deleteObjects', () => {
  it('does nothing for empty array', async () => {
    await expect(deleteObjects([])).resolves.toBeUndefined()
  })

  it('completes without error for non-empty array', async () => {
    await expect(deleteObjects(['key1', 'key2'])).resolves.toBeUndefined()
  })
})

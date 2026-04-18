import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createId } from '@paralleldrive/cuid2'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.warn(`Missing environment variable: ${name}`)
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function createS3Client(): S3Client {
  const region = getEnvVar('S3_REGION')
  const accessKeyId = getEnvVar('S3_ACCESS_KEY_ID')
  const secretAccessKey = getEnvVar('S3_SECRET_ACCESS_KEY')
  const endpoint = process.env['S3_ENDPOINT']

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  })
}

function buildS3BaseUrl(): string {
  const bucket = getEnvVar('S3_BUCKET')
  const region = getEnvVar('S3_REGION')
  const endpoint = process.env['S3_ENDPOINT']

  return endpoint
    ? `${endpoint}/${bucket}`
    : `https://${bucket}.s3.${region}.amazonaws.com`
}

export function getPhotoUrlPrefix(gameId: string): string {
  return `${buildS3BaseUrl()}/games/${gameId}/submissions/`
}

export async function getPresignedUploadUrl(
  gameId: string,
  contentType: string,
): Promise<{ uploadUrl: string; photoUrl: string; key: string }> {
  const bucket = getEnvVar('S3_BUCKET')
  const key = `games/${gameId}/submissions/${createId()}.webp`
  const client = createS3Client()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })
  const photoUrl = `${buildS3BaseUrl()}/${key}`

  return { uploadUrl, photoUrl, key }
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const bucket = getEnvVar('S3_BUCKET')
  const client = createS3Client()

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    )
  }
}

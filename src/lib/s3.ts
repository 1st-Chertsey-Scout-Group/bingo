import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
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

export async function getPresignedUploadUrl(
  gameId: string,
  contentType: string,
): Promise<{ uploadUrl: string; photoUrl: string }> {
  const bucket = getEnvVar('S3_BUCKET')
  const region = getEnvVar('S3_REGION')
  const endpoint = process.env['S3_ENDPOINT']

  const key = `games/${gameId}/submissions/${createId()}.webp`
  const client = createS3Client()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 })

  const photoUrl = endpoint
    ? `${endpoint}/${bucket}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  return { uploadUrl, photoUrl }
}

import 'dotenv/config'
import { PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'

const client = new S3Client({
  endpoint: process.env['S3_ENDPOINT'],
  region: process.env['S3_REGION'],
  credentials: {
    accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? '',
    secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] ?? '',
  },
  forcePathStyle: true,
})

const bucket = process.env['S3_BUCKET'] ?? ''

const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGamePhotos',
      Effect: 'Allow',
      Principal: '*',
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucket}/games/*`,
    },
  ],
}

async function main() {
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }),
  )
  console.log(`Public-read policy applied to ${bucket}/games/*`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

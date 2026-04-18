import 'dotenv/config'
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3'

const client = new S3Client({
  endpoint: process.env['S3_ENDPOINT'],
  region: process.env['S3_REGION'],
  credentials: {
    accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? '',
    secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] ?? '',
  },
  forcePathStyle: true,
})

async function main() {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: process.env['S3_BUCKET'],
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [
              'https://bingo.1stchertseyscoutgroup.com',
              'https://bingo.1stchertsey.com',
              'http://localhost:3000',
            ],
            AllowedMethods: ['PUT', 'GET', 'HEAD'],
            AllowedHeaders: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    }),
  )
  console.log('CORS policy applied')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

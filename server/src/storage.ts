import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from './config.js'

const s3 = new S3Client({
  region: config.awsRegion || undefined,
  endpoint: config.s3Endpoint || undefined,
  forcePathStyle: Boolean(config.s3Endpoint),
})

function requireBucket() {
  if (!config.awsRegion || !config.s3Bucket) {
    throw new Error('Private file storage is not configured. Set AWS_REGION and S3_BUCKET.')
  }
  return config.s3Bucket
}

export async function putPrivateFile(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: requireBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  }))
}

export async function createDownloadUrl(key: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180)
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: requireBucket(),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    }),
    { expiresIn: 60 },
  )
}

export async function deletePrivateFiles(keys: string[]) {
  const bucket = requireBucket()
  if (keys.length === 0) return
  for (let index = 0; index < keys.length; index += 1000) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.slice(index, index + 1000).map((Key) => ({ Key })), Quiet: true },
    }))
  }
}

import 'dotenv/config'

const jwtSecret = process.env.JWT_SECRET ?? ''

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.')
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  awsRegion: process.env.AWS_REGION ?? '',
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

export const isProduction = config.nodeEnv === 'production'

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

if (isProduction) {
  let clientOrigin: URL
  let clientUrl: URL
  try {
    clientOrigin = new URL(config.clientOrigin)
    clientUrl = new URL(config.clientUrl)
  } catch {
    throw new Error('Production CLIENT_ORIGIN and CLIENT_URL must be valid HTTPS origins.')
  }
  if (clientOrigin.protocol !== 'https:' || clientOrigin.origin !== config.clientOrigin) {
    throw new Error('Production CLIENT_ORIGIN must be the exact HTTPS frontend origin, without a trailing slash.')
  }
  if (clientUrl.protocol !== 'https:' || clientUrl.pathname !== '/' || clientUrl.search || clientUrl.hash || clientUrl.origin !== clientOrigin.origin) {
    throw new Error('Production CLIENT_URL must be the same HTTPS origin as CLIENT_ORIGIN, without a path.')
  }
}

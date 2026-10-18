import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoose from 'mongoose'
import multer from 'multer'
import { config } from './config.js'
import { apiRouter } from './routes.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: config.clientOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api', apiRouter)
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Files must be 20 MB or smaller.' : error.message })
    return
  }
  if (error instanceof Error && error.message.includes('Upload a PDF')) {
    res.status(400).json({ message: error.message })
    return
  }
  console.error(error)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
})

async function start() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required. Add your MongoDB Atlas connection string to server/.env.')
  await mongoose.connect(config.mongoUri)
  app.listen(config.port, '0.0.0.0', () => console.log(`ChaseList API listening on port ${config.port}`))
}

start().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import argon2 from 'argon2'
import { z } from 'zod'
import { Client, ClientRequest, User } from './models.js'
import { config, isProduction } from './config.js'
import { requireAuth, requireTrustedOrigin, setSessionCookie } from './middleware.js'
import { createDownloadUrl, deletePrivateFiles, putPrivateFile } from './storage.js'

const router = Router()

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false })
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false })
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false })

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
})

const clientSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
})

const requestSchema = z.object({
  clientId: z.string().regex(/^[a-f\d]{24}$/i),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  title: z.string().trim().min(1).max(120),
  dueDate: z.coerce.date(),
  items: z.array(z.object({
    label: z.string().trim().min(1).max(160),
    kind: z.enum(['document', 'question']),
    required: z.boolean(),
  })).min(1).max(30),
})

const answerSchema = z.object({
  answers: z.array(z.object({
    itemId: z.string().uuid(),
    answer: z.string().trim().max(2000).optional().default(''),
    notApplicable: z.boolean().default(false),
  })).max(30),
})

const reviewSchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
  note: z.string().trim().max(500).optional().default(''),
})

const allowedFiles = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedFiles.has(file.mimetype)) {
      callback(new Error('Upload a PDF, JPG, or PNG file (20 MB maximum).'))
      return
    }
    callback(null, true)
  },
})

function sendError(res: import('express').Response, status: number, message: string) {
  res.status(status).json({ message })
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function publicRequestUrl(token: string) {
  return `${config.clientUrl.replace(/\/$/, '')}/upload/${token}`
}

function sanitizeRequest(request: NonNullable<Awaited<ReturnType<typeof ClientRequest.findOne>>>) {
  return {
    id: request.id,
    clientId: request.clientId.toString(),
    month: request.month,
    title: request.title,
    dueDate: request.dueDate,
    status: request.status,
    expiresAt: request.expiresAt,
    sentAt: request.sentAt,
    submittedAt: request.submittedAt,
    items: request.items.map((item) => ({
      itemId: item.itemId,
      label: item.label,
      kind: item.kind,
      required: item.required,
      status: item.status,
      answer: item.answer ?? '',
      reviewNote: item.reviewNote ?? '',
      files: item.files.map((file) => ({
        fileId: file.fileId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: file.uploadedAt,
      })),
    })),
  }
}

function isOverdue(dueDate: Date, status: string) {
  return status !== 'completed' && new Date(dueDate).getTime() < Date.now()
}

router.post('/auth/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0]?.message ?? 'Check the information and try again.')

  const existing = await User.findOne({ email: parsed.data.email }).select('+passwordHash')
  if (existing) return sendError(res, 409, 'An account with this email already exists.')

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id })
  const user = await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash })
  setSessionCookie(res, user.id)
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } })
})

router.post('/auth/login', authLimiter, async (req, res) => {
  const parsed = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }).safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, 'Enter a valid email and password.')
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash')
  if (!user || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
    return sendError(res, 401, 'Email or password is incorrect.')
  }
  setSessionCookie(res, user.id)
  res.json({ user: { id: user.id, name: user.name, email: user.email } })
})

router.post('/auth/logout', requireTrustedOrigin, (_req, res) => {
  res.clearCookie('chase_session', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/' })
  res.json({ message: 'Signed out.' })
})

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.bookkeeperId).select('name email')
  if (!user) return sendError(res, 401, 'Please sign in to continue.')
  res.json({ user: { id: user.id, name: user.name, email: user.email } })
})

router.get('/dashboard', requireAuth, async (req, res) => {
  const bookkeeperId = req.bookkeeperId!
  const [clients, requests] = await Promise.all([
    Client.find({ bookkeeperId }).sort({ companyName: 1 }).lean(),
    ClientRequest.find({ bookkeeperId }).sort({ createdAt: -1 }).limit(100).lean(),
  ])
  const clientsById = new Map(clients.map((client) => [client._id.toString(), client]))
  const overdue = requests.filter((request) => isOverdue(request.dueDate, request.status))
  const pendingCount = requests.reduce((total, request) => total + request.items.filter((item) => ['requested', 'rejected'].includes(item.status)).length, 0)
  const serializedRequests = requests.slice(0, 8).map((request) => {
    const client = clientsById.get(request.clientId.toString())
    return {
      id: request._id.toString(),
      clientId: request.clientId.toString(),
      clientName: client?.companyName ?? 'Client',
      title: request.title,
      month: request.month,
      dueDate: request.dueDate,
      status: isOverdue(request.dueDate, request.status) ? 'overdue' : request.status,
      itemCount: request.items.length,
    }
  })
  res.json({
    metrics: {
      totalClients: clients.length,
      pendingDocuments: pendingCount,
      completedRequests: requests.filter((request) => request.status === 'completed').length,
      overdueRequests: overdue.length,
    },
    recentRequests: serializedRequests,
    attention: serializedRequests.filter((request) => request.status === 'overdue').slice(0, 4),
  })
})

router.get('/clients', requireAuth, async (req, res) => {
  const bookkeeperId = req.bookkeeperId!
  const clients = await Client.find({ bookkeeperId }).sort({ companyName: 1 }).lean()
  const openCounts = await ClientRequest.aggregate([
    { $match: { bookkeeperId: new (await import('mongoose')).Types.ObjectId(bookkeeperId), status: { $ne: 'completed' } } },
    { $group: { _id: '$clientId', count: { $sum: 1 } } },
  ])
  const countsByClient = new Map(openCounts.map((entry) => [entry._id.toString(), entry.count as number]))
  res.json({ clients: clients.map((client) => ({
    id: client._id.toString(), companyName: client.companyName, contactName: client.contactName,
    email: client.email, phone: client.phone ?? '', notes: client.notes ?? '',
    openRequests: countsByClient.get(client._id.toString()) ?? 0,
    status: (countsByClient.get(client._id.toString()) ?? 0) > 0 ? 'Needs docs' : 'Active',
  })) })
})

router.post('/clients', requireAuth, requireTrustedOrigin, async (req, res) => {
  const parsed = clientSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0]?.message ?? 'Check the client details.')
  const client = await Client.create({ ...parsed.data, bookkeeperId: req.bookkeeperId })
  res.status(201).json({ client: { id: client.id, ...parsed.data, openRequests: 0, status: 'Active' } })
})

router.get('/clients/:clientId', requireAuth, async (req, res) => {
  const bookkeeperId = req.bookkeeperId!
  const client = await Client.findOne({ _id: req.params.clientId, bookkeeperId })
  if (!client) return sendError(res, 404, 'Client not found.')
  const requests = await ClientRequest.find({ bookkeeperId, clientId: client._id }).sort({ createdAt: -1 })
  res.json({
    client: { id: client.id, companyName: client.companyName, contactName: client.contactName, email: client.email, phone: client.phone ?? '', notes: client.notes ?? '' },
    requests: requests.map((request) => ({ ...sanitizeRequest(request), status: isOverdue(request.dueDate, request.status) ? 'overdue' : request.status })),
  })
})

router.patch('/clients/:clientId', requireAuth, requireTrustedOrigin, async (req, res) => {
  const parsed = clientSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0]?.message ?? 'Check the client details.')
  const client = await Client.findOneAndUpdate(
    { _id: req.params.clientId, bookkeeperId: req.bookkeeperId }, parsed.data, { new: true, runValidators: true },
  )
  if (!client) return sendError(res, 404, 'Client not found.')
  res.json({ client: { id: client.id, ...parsed.data } })
})

router.delete('/clients/:clientId', requireAuth, requireTrustedOrigin, async (req, res) => {
  const bookkeeperId = req.bookkeeperId!
  const client = await Client.findOne({ _id: req.params.clientId, bookkeeperId })
  if (!client) return sendError(res, 404, 'Client not found.')
  const requests = await ClientRequest.find({ bookkeeperId, clientId: client._id })
  const storageKeys = requests.flatMap((request) => request.items.flatMap((item) => item.files.map((file) => file.storageKey)))
  if (storageKeys.length > 0) await deletePrivateFiles(storageKeys)
  await ClientRequest.deleteMany({ bookkeeperId, clientId: client._id })
  await Client.deleteOne({ _id: client._id, bookkeeperId })
  res.json({ message: 'Client and their requests were deleted.' })
})

router.get('/requests', requireAuth, async (req, res) => {
  const bookkeeperId = req.bookkeeperId!
  const requests = await ClientRequest.find({ bookkeeperId }).sort({ createdAt: -1 }).limit(100)
  const clientIds = [...new Set(requests.map((request) => request.clientId.toString()))]
  const clients = await Client.find({ bookkeeperId, _id: { $in: clientIds } }).select('companyName email')
  const clientsById = new Map(clients.map((client) => [client.id, client]))
  res.json({ requests: requests.map((request) => ({
    ...sanitizeRequest(request),
    client: clientsById.get(request.clientId.toString()) ? {
      id: request.clientId.toString(),
      companyName: clientsById.get(request.clientId.toString())!.companyName,
      email: clientsById.get(request.clientId.toString())!.email,
    } : null,
    status: isOverdue(request.dueDate, request.status) ? 'overdue' : request.status,
  })) })
})

router.post('/requests', requireAuth, requireTrustedOrigin, async (req, res) => {
  if (!config.awsRegion || !config.s3Bucket) return sendError(res, 503, 'Configure AWS_REGION and S3_BUCKET before creating upload requests.')
  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0]?.message ?? 'Check the request details.')
  const bookkeeperId = req.bookkeeperId!
  const client = await Client.findOne({ _id: parsed.data.clientId, bookkeeperId })
  if (!client) return sendError(res, 404, 'Client not found.')
  const token = randomBytes(32).toString('base64url')
  const sentAt = new Date()
  const request = await ClientRequest.create({
    ...parsed.data,
    bookkeeperId,
    clientId: client._id,
    status: 'sent',
    shareTokenHash: tokenHash(token),
    sentAt,
    expiresAt: new Date(sentAt.getTime() + 30 * 24 * 60 * 60 * 1000),
    items: parsed.data.items.map((item) => ({ ...item, itemId: randomUUID(), status: 'requested', files: [] })),
  })
  res.status(201).json({ request: sanitizeRequest(request), shareUrl: publicRequestUrl(token), client: { email: client.email, companyName: client.companyName } })
})

router.get('/requests/:requestId', requireAuth, async (req, res) => {
  const request = await ClientRequest.findOne({ _id: req.params.requestId, bookkeeperId: req.bookkeeperId })
  if (!request) return sendError(res, 404, 'Request not found.')
  const client = await Client.findOne({ _id: request.clientId, bookkeeperId: req.bookkeeperId }).select('companyName contactName email')
  res.json({ request: sanitizeRequest(request), client: client ? { id: client.id, companyName: client.companyName, contactName: client.contactName, email: client.email } : null })
})

router.post('/requests/:requestId/reminder', requireAuth, requireTrustedOrigin, async (req, res) => {
  const request = await ClientRequest.findOne({ _id: req.params.requestId, bookkeeperId: req.bookkeeperId })
  if (!request) return sendError(res, 404, 'Request not found.')
  if (request.status === 'completed') return sendError(res, 409, 'This request is already complete.')
  const client = await Client.findOne({ _id: request.clientId, bookkeeperId: req.bookkeeperId }).select('companyName email')
  if (!client) return sendError(res, 404, 'Client not found.')
  const token = randomBytes(32).toString('base64url')
  request.shareTokenHash = tokenHash(token)
  request.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await request.save()
  res.json({ shareUrl: publicRequestUrl(token), email: client.email, clientName: client.companyName })
})

router.delete('/requests/:requestId', requireAuth, requireTrustedOrigin, async (req, res) => {
  const request = await ClientRequest.findOne({ _id: req.params.requestId, bookkeeperId: req.bookkeeperId })
  if (!request) return sendError(res, 404, 'Request not found.')
  const storageKeys = request.items.flatMap((item) => item.files.map((file) => file.storageKey))
  if (storageKeys.length > 0) await deletePrivateFiles(storageKeys)
  await ClientRequest.deleteOne({ _id: request._id, bookkeeperId: req.bookkeeperId })
  res.json({ message: 'Request deleted.' })
})

router.get('/requests/:requestId/files/:fileId/download', requireAuth, async (req, res) => {
  const request = await ClientRequest.findOne({ _id: req.params.requestId, bookkeeperId: req.bookkeeperId })
  const file = request?.items.flatMap((item) => item.files).find((candidate) => candidate.fileId === req.params.fileId)
  if (!request || !file) return sendError(res, 404, 'File not found.')
  try {
    res.json({ url: await createDownloadUrl(file.storageKey, file.originalName), expiresIn: 60 })
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : 'File storage is unavailable.' })
  }
})

router.patch('/requests/:requestId/items/:itemId/review', requireAuth, requireTrustedOrigin, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, 'Choose whether to accept or reject this item.')
  if (parsed.data.decision === 'rejected' && !parsed.data.note.trim()) return sendError(res, 400, 'Add a note so your client knows what needs to change.')
  const request = await ClientRequest.findOne({ _id: req.params.requestId, bookkeeperId: req.bookkeeperId })
  if (!request) return sendError(res, 404, 'Request not found.')
  const item = request.items.find((candidate) => candidate.itemId === req.params.itemId)
  if (!item || item.status === 'requested' || item.status === 'not_applicable') return sendError(res, 409, 'This item is not ready for review.')
  item.status = parsed.data.decision
  item.reviewNote = parsed.data.note
  request.status = request.items.every((candidate) => ['accepted', 'not_applicable'].includes(candidate.status)) ? 'completed' : 'in_review'
  await request.save()
  res.json({ request: sanitizeRequest(request) })
})

router.post('/public/requests/:token/files/:itemId', publicLimiter, uploadLimiter, upload.single('file'), async (req, res) => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] ?? '' : req.params.token
  const request = await ClientRequest.findOne({ shareTokenHash: tokenHash(token) })
  if (!request || request.expiresAt.getTime() < Date.now()) return sendError(res, 404, 'This secure upload link has expired or could not be found.')
  if (request.status === 'completed') return sendError(res, 409, 'This request has already been completed.')
  const item = request.items.find((candidate) => candidate.itemId === req.params.itemId)
  if (!item || item.kind !== 'document' || item.status === 'not_applicable') return sendError(res, 404, 'This document request is unavailable.')
  if (item.files.length >= 10) return sendError(res, 409, 'This checklist item has reached its 10-file limit.')
  const file = req.file
  if (!file) return sendError(res, 400, 'Choose a file to upload.')
  const expectedExtension = allowedFiles.get(file.mimetype)
  const isPdf = file.mimetype === 'application/pdf' && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  const isJpeg = file.mimetype === 'image/jpeg' && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff
  const isPng = file.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (!expectedExtension || !(isPdf || isJpeg || isPng)) return sendError(res, 400, 'The file contents do not match a supported PDF, JPG, or PNG type.')
  try {
    const fileId = randomUUID()
    const storageKey = `private/${request.bookkeeperId}/${request.id}/${item.itemId}/${fileId}.${expectedExtension}`
    await putPrivateFile(storageKey, file.buffer, file.mimetype)
    item.files.push({ fileId, originalName: file.originalname.replace(/[\r\n]/g, '').slice(0, 200), mimeType: file.mimetype, size: file.size, storageKey, uploadedAt: new Date() })
    item.status = 'submitted'
    await request.save()
    res.status(201).json({ file: { fileId, originalName: file.originalname, size: file.size, uploadedAt: new Date() } })
  } catch (error) {
    res.status(503).json({ message: error instanceof Error ? error.message : 'Upload could not be saved. Please try again.' })
  }
})

router.get('/public/requests/:token', publicLimiter, async (req, res) => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] ?? '' : req.params.token
  const request = await ClientRequest.findOne({ shareTokenHash: tokenHash(token) })
  if (!request || request.expiresAt.getTime() < Date.now()) return sendError(res, 404, 'This secure upload link has expired or could not be found.')
  if (request.status === 'completed') return sendError(res, 410, 'This request is complete. Contact your bookkeeper if you need to make a change.')
  const client = await Client.findOne({ _id: request.clientId, bookkeeperId: request.bookkeeperId }).select('companyName')
  res.json({
    request: {
      id: request.id, title: request.title, month: request.month, dueDate: request.dueDate,
      expiresAt: request.expiresAt, status: request.status,
      items: request.items.map((item) => ({
        itemId: item.itemId, label: item.label, kind: item.kind, required: item.required,
        status: item.status, answer: item.answer ?? '', reviewNote: item.reviewNote ?? '',
        files: item.files.map((file) => ({ fileId: file.fileId, originalName: file.originalName, size: file.size })),
      })),
    },
    clientName: client?.companyName ?? 'Your bookkeeper',
  })
})

router.post('/public/requests/:token/submit', publicLimiter, async (req, res) => {
  const parsed = answerSchema.safeParse(req.body)
  if (!parsed.success) return sendError(res, 400, 'Check your answers and try again.')
  const token = Array.isArray(req.params.token) ? req.params.token[0] ?? '' : req.params.token
  const request = await ClientRequest.findOne({ shareTokenHash: tokenHash(token) })
  if (!request || request.expiresAt.getTime() < Date.now()) return sendError(res, 404, 'This secure upload link has expired or could not be found.')
  if (request.status === 'completed') return sendError(res, 409, 'This request has already been completed.')
  const answersById = new Map(parsed.data.answers.map((answer) => [answer.itemId, answer]))
  for (const item of request.items) {
    const answer = answersById.get(item.itemId)
    if (answer?.notApplicable) {
      if (item.required) return sendError(res, 400, `${item.label} is required and cannot be marked not applicable.`)
      item.status = 'not_applicable'
      item.answer = ''
      continue
    }
    item.answer = answer?.answer ?? ''
    const complete = item.kind === 'document' ? item.files.length > 0 : Boolean(item.answer)
    if (!complete && item.required) return sendError(res, 400, `Please complete “${item.label}” before submitting.`)
    if (!complete) return sendError(res, 400, `Upload or mark “${item.label}” not applicable before submitting.`)
    if (item.status !== 'accepted') item.status = 'submitted'
  }
  request.status = 'submitted'
  request.submittedAt = new Date()
  await request.save()
  res.json({ message: 'Your documents and answers have been sent to your bookkeeper.' })
})

export { router as apiRouter }

import { model, Schema, Types } from 'mongoose'

export interface UserRecord {
  name: string
  email: string
  passwordHash: string
}

export interface ClientRecord {
  bookkeeperId: Types.ObjectId
  companyName: string
  contactName: string
  email: string
  phone?: string
  notes?: string
}

export interface RequestFileRecord {
  fileId: string
  originalName: string
  mimeType: string
  size: number
  storageKey: string
  uploadedAt: Date
}

export interface ChecklistItemRecord {
  itemId: string
  label: string
  kind: 'document' | 'question'
  required: boolean
  status: 'requested' | 'submitted' | 'accepted' | 'rejected' | 'not_applicable'
  answer?: string
  reviewNote?: string
  files: RequestFileRecord[]
}

export interface RequestRecord {
  bookkeeperId: Types.ObjectId
  clientId: Types.ObjectId
  month: string
  title: string
  dueDate: Date
  status: 'sent' | 'submitted' | 'in_review' | 'completed'
  shareTokenHash: string
  expiresAt: Date
  sentAt: Date
  submittedAt?: Date
  items: ChecklistItemRecord[]
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
)

const clientSchema = new Schema<ClientRecord>(
  {
    bookkeeperId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 40 },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

clientSchema.index({ bookkeeperId: 1, companyName: 1 })

const fileSchema = new Schema<RequestFileRecord>(
  {
    fileId: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
)

const itemSchema = new Schema<ChecklistItemRecord>(
  {
    itemId: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 160 },
    kind: { type: String, enum: ['document', 'question'], required: true },
    required: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['requested', 'submitted', 'accepted', 'rejected', 'not_applicable'],
      default: 'requested',
    },
    answer: { type: String, trim: true, maxlength: 2000 },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    files: { type: [fileSchema], default: [] },
  },
  { _id: false },
)

const requestSchema = new Schema<RequestRecord>(
  {
    bookkeeperId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    clientId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Client' },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['sent', 'submitted', 'in_review', 'completed'], default: 'sent' },
    shareTokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, required: true },
    submittedAt: Date,
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
)

requestSchema.index({ bookkeeperId: 1, clientId: 1, createdAt: -1 })

export const User = model<UserRecord>('User', userSchema)
export const Client = model<ClientRecord>('Client', clientSchema)
export const ClientRequest = model<RequestRecord>('ClientRequest', requestSchema)

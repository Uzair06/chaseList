export interface User {
  id: string
  name: string
  email: string
}

export interface ClientRecord {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  notes?: string
  openRequests?: number
  status?: string
}

export interface RequestFile {
  fileId: string
  originalName: string
  mimeType?: string
  size: number
  uploadedAt?: string
}

export interface ChecklistItem {
  itemId: string
  label: string
  kind: 'document' | 'question'
  required: boolean
  status: 'requested' | 'submitted' | 'accepted' | 'rejected' | 'not_applicable'
  answer?: string
  reviewNote?: string
  files: RequestFile[]
}

export interface ClientRequest {
  id: string
  clientId: string
  client?: Pick<ClientRecord, 'id' | 'companyName' | 'email'> | null
  month: string
  title: string
  dueDate: string
  expiresAt?: string
  sentAt?: string
  submittedAt?: string
  status: string
  items: ChecklistItem[]
}

export interface ClientFormValues {
  companyName: string
  contactName: string
  email: string
  phone: string
  notes: string
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Clipboard, Download, ExternalLink, FileText, Mail, Trash2, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Field, inputClass, Panel, Spinner, StatusBadge } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, formatSize, monthLabel } from '../lib/format.ts'
import type { ChecklistItem, ClientRecord, ClientRequest } from '../types.ts'

export function RequestDetailPage() {
  const { requestId = '' } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState<ClientRequest | null>(null)
  const [client, setClient] = useState<Pick<ClientRecord, 'id' | 'companyName' | 'contactName' | 'email'> | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await api<{ request: ClientRequest; client: typeof client }>(`/requests/${requestId}`)
      setRequest(result.request); setClient(result.client)
      setNotes(Object.fromEntries(result.request.items.map((item) => [item.itemId, item.reviewNote ?? ''])))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this request.') }
    finally { setLoading(false) }
  }, [requestId])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const emailHref = useMemo(() => {
    if (!request || !client || !shareUrl) return '#'
    const subject = `Reminder: ${request.title} for ${monthLabel(request.month)}`
    const body = `Hi ${client.contactName},\n\nA friendly reminder to complete your ${request.title.toLowerCase()} for ${monthLabel(request.month)}. Use this secure link to upload your documents and answers:\n${shareUrl}\n\nThe request is due ${formatDate(request.dueDate)}.\n\nThank you!`
    return `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [request, client, shareUrl])

  async function review(item: ChecklistItem, decision: 'accepted' | 'rejected') {
    const note = notes[item.itemId] ?? ''
    if (decision === 'rejected' && !note.trim()) { setError('Add a note before rejecting an item.'); return }
    setError(''); setSuccess(''); setWorking(item.itemId)
    try {
      await api(`/requests/${requestId}/items/${item.itemId}/review`, { method: 'PATCH', body: { decision, note } })
      setSuccess(decision === 'accepted' ? 'Item accepted.' : 'Item returned to the client with your note.')
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this item.') }
    finally { setWorking('') }
  }

  async function download(fileId: string) {
    setWorking(fileId); setError('')
    try {
      const result = await api<{ url: string }>(`/requests/${requestId}/files/${fileId}/download`)
      window.location.assign(result.url)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not access this file.') }
    finally { setWorking('') }
  }

  async function prepareReminder() {
    setWorking('reminder'); setError(''); setSuccess('')
    try {
      const result = await api<{ shareUrl: string }>('/requests/' + requestId + '/reminder', { method: 'POST' })
      setShareUrl(result.shareUrl); setSuccess('A fresh secure link is ready. The previous link has been replaced.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare a reminder.') }
    finally { setWorking('') }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setSuccess('Secure link copied.') }
    catch { setError('Clipboard access is unavailable. Select and copy the link below.') }
  }

  async function deleteRequest() {
    if (!window.confirm('Delete this request and its privately stored files? This cannot be undone.')) return
    setDeleting(true); setError('')
    try { await api(`/requests/${requestId}`, { method: 'DELETE' }); navigate(client ? `/app/clients/${client.id}` : '/app/requests') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete the request.'); setDeleting(false) }
  }

  if (loading) return <Spinner label="Loading request" />
  if (!request) return <div className="mx-auto max-w-2xl"><Alert>{error || 'Request not found.'} <button onClick={() => void load()} className="ml-2 font-medium underline">Try again</button></Alert></div>
  const submittedCount = request.items.filter((item) => ['submitted', 'accepted', 'rejected'].includes(item.status)).length

  return <div>
    <Link to={client ? `/app/clients/${client.id}` : '/app/requests'} className="inline-flex items-center gap-1.5 text-xs text-[#7b8997] hover:text-[#3f5065]"><ArrowLeft className="h-3.5 w-3.5" /> {client?.companyName ?? 'All requests'}</Link>
    <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-[25px] font-medium tracking-[-.045em] text-[#233248]">{request.title}</h1><StatusBadge status={request.status} /></div><p className="mt-1 text-sm text-[#8491a0]">{client?.companyName ?? 'Client'} · {monthLabel(request.month)} · Due {formatDate(request.dueDate)}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void prepareReminder()} disabled={working === 'reminder' || request.status === 'completed'}><Mail className="h-4 w-4" /> {working === 'reminder' ? 'Preparing…' : 'Email reminder'}</Button><Button variant="danger" onClick={() => void deleteRequest()} disabled={deleting}><Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}</Button></div></div>
    {error && <div className="mt-5"><Alert>{error}</Alert></div>}
    {success && <div className="mt-5"><Alert tone="success">{success}</Alert></div>}
    {shareUrl && <Panel className="mt-5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[#536276]">Fresh secure link · valid for 30 days</p><input readOnly value={shareUrl} className={`${inputClass} mt-2 text-xs`} onFocus={(event) => event.currentTarget.select()} /></div><div className="flex gap-2"><Button variant="secondary" onClick={() => void copyLink()}><Clipboard className="h-4 w-4" /> Copy link</Button><a href={emailHref}><Button><ExternalLink className="h-4 w-4" /> Open email</Button></a></div></div></Panel>}

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Panel className="overflow-hidden">
        <div className="flex items-end justify-between border-b border-[#edf1f3] px-5 py-4 sm:px-6"><div><h2 className="text-[16px] font-medium text-[#34445a]">Document checklist</h2><p className="mt-1 text-xs text-[#8995a2]">Review files and client answers</p></div><span className="text-xs text-[#7c8998]">{submittedCount} of {request.items.length} received</span></div>
        <div className="divide-y divide-[#edf1f3]">{request.items.map((item, index) => <section key={item.itemId} className="p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f6f7] text-xs text-[#718092]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-[#34445a]">{item.label}</h3><StatusBadge status={item.status} /></div><p className="mt-1 text-[11px] text-[#8995a2]">{item.required ? 'Required' : 'Optional'} · {item.kind === 'document' ? 'File upload' : 'Client answer'}</p>
            {item.answer && <div className="mt-3 rounded-lg bg-[#f8fafb] p-3"><p className="text-[10px] font-medium uppercase tracking-wider text-[#8b97a3]">Client answer</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#536276]">{item.answer}</p></div>}
            {item.files.length > 0 && <div className="mt-3 space-y-2">{item.files.map((file) => <div key={file.fileId} className="flex flex-col gap-2 rounded-lg border border-[#e8edf0] px-3 py-2.5 sm:flex-row sm:items-center"><span className="flex min-w-0 flex-1 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#eef5f1] text-[#41825e]"><FileText className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-medium text-[#45556a]">{file.originalName}</span><span className="mt-0.5 block text-[10px] text-[#909ca8]">{formatSize(file.size)}</span></span></span><Button variant="secondary" className="min-h-8 px-3 text-xs" disabled={working === file.fileId} onClick={() => void download(file.fileId)}><Download className="h-3.5 w-3.5" /> {working === file.fileId ? 'Opening…' : 'Secure download'}</Button></div>)}</div>}
            {item.reviewNote && <div className="mt-3 rounded-lg border border-[#f3dfd2] bg-[#fff9f5] px-3 py-2.5 text-xs text-[#946147]"><span className="font-medium">Bookkeeper note:</span> {item.reviewNote}</div>}
            {['submitted', 'rejected'].includes(item.status) && request.status !== 'completed' && <div className="mt-4 rounded-lg bg-[#fafcfc] p-3"><Field label={item.status === 'rejected' ? 'Update your review note' : 'Review note'} hint={item.status === 'rejected' ? 'Required when returning this item.' : 'Optional if accepting. Required if you reject.'}><textarea rows={2} maxLength={500} value={notes[item.itemId] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.itemId]: event.target.value }))} className={`${inputClass} resize-y`} placeholder="Add context for your client…" /></Field><div className="mt-3 flex flex-wrap justify-end gap-2"><Button variant="danger" className="min-h-9 px-3 text-xs" disabled={working === item.itemId} onClick={() => void review(item, 'rejected')}><X className="h-3.5 w-3.5" /> Reject with note</Button><Button className="min-h-9 px-3 text-xs" disabled={working === item.itemId} onClick={() => void review(item, 'accepted')}><Check className="h-3.5 w-3.5" /> Accept</Button></div></div>}
          </div></div></section>)}</div>
      </Panel>
      <aside className="space-y-4"><Panel className="p-5"><h2 className="text-[15px] font-medium text-[#34445a]">Request details</h2><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-[#8a97a4]">Client</dt><dd className="text-right font-medium text-[#516176]">{client?.companyName}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#8a97a4]">Period</dt><dd className="text-right font-medium text-[#516176]">{monthLabel(request.month)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#8a97a4]">Due date</dt><dd className="text-right font-medium text-[#516176]">{formatDate(request.dueDate, { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#8a97a4]">Created</dt><dd className="text-right font-medium text-[#516176]">{request.sentAt ? formatDate(request.sentAt) : '—'}</dd></div></dl></Panel><Panel className="p-5"><div className="flex items-center gap-2 text-[#19875b]"><CheckCircle2 className="h-4 w-4" /><h2 className="text-[14px] font-medium text-[#34445a]">Private file storage</h2></div><p className="mt-2 text-xs leading-5 text-[#8995a2]">Client files are stored privately. Download links are signed and expire after 60 seconds.</p></Panel></aside>
    </div>
  </div>
}

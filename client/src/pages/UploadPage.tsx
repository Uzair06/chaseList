import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, FileText, LoaderCircle, ShieldCheck, UploadCloud } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Alert, Button, inputClass, Panel, Spinner, StatusBadge } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, formatSize, monthLabel } from '../lib/format.ts'
import type { ChecklistItem, ClientRequest } from '../types.ts'

interface PublicItem extends ChecklistItem {
  files: Array<{ fileId: string; originalName: string; size: number }>
}

export function UploadPage() {
  const { token = '' } = useParams()
  const [request, setRequest] = useState<(Omit<ClientRequest, 'items'> & { items: PublicItem[] }) | null>(null)
  const [clientName, setClientName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [notApplicable, setNotApplicable] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await api<{ request: Omit<ClientRequest, 'items'> & { items: PublicItem[] }; clientName: string }>(`/public/requests/${token}`)
      setRequest(result.request); setClientName(result.clientName)
      setAnswers(Object.fromEntries(result.request.items.map((item) => [item.itemId, item.answer ?? ''])))
      setNotApplicable(Object.fromEntries(result.request.items.map((item) => [item.itemId, item.status === 'not_applicable'])))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This secure upload link is not available.') }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function uploadFile(item: PublicItem, file?: File) {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setError(`${file.name} is larger than 20 MB.`); return }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { setError('Choose a PDF, JPG, or PNG file.'); return }
    setError(''); setUploading(item.itemId)
    try {
      const form = new FormData(); form.append('file', file)
      await api(`/public/requests/${token}/files/${item.itemId}`, { method: 'POST', body: form })
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Upload failed. Please try again.') }
    finally { setUploading(''); if (fileInputs.current[item.itemId]) fileInputs.current[item.itemId]!.value = '' }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('')
    try {
      await api(`/public/requests/${token}/submit`, {
        method: 'POST', body: { answers: request?.items.map((item) => ({ itemId: item.itemId, answer: answers[item.itemId] ?? '', notApplicable: Boolean(notApplicable[item.itemId]) })) ?? [] },
      })
      setSuccess(true)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your documents.') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#f7f9fb]"><div className="mx-auto max-w-[760px] px-5 pt-10"><Spinner label="Opening secure upload" /></div></div>

  if (!request) return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-5 py-10"><Panel className="w-full max-w-[480px] p-6 sm:p-8"><BrandMark /><h1 className="mt-6 text-[23px] font-medium tracking-[-.04em] text-[#233248]">Upload link unavailable</h1><div className="mt-4"><Alert>{error}</Alert></div><p className="mt-4 text-sm leading-6 text-[#7c8998]">Ask your bookkeeper to confirm the link or send you a fresh one.</p></Panel></main>

  const completedCount = request.items.filter((item) => item.status !== 'requested').length
  if (success) return <main className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-5 py-10"><Panel className="w-full max-w-[520px] p-7 text-center sm:p-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ef] text-[#19875b]"><CheckCircle2 className="h-7 w-7" /></div><h1 className="mt-5 text-[25px] font-medium tracking-[-.045em] text-[#233248]">You’re all set.</h1><p className="mt-2 text-sm leading-6 text-[#7c8998]">Your documents and answers were sent securely to {clientName}. You can close this page.</p><div className="mt-6 rounded-lg bg-[#f7faf8] px-4 py-3 text-left text-xs text-[#687b70]"><span className="font-medium">{request.title}</span><span className="mt-1 block">{monthLabel(request.month)} · {request.items.length} checklist items</span></div></Panel></main>

  return <main className="min-h-screen bg-[#f7f9fb] px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
    <div className="mx-auto max-w-[720px]">
      <div className="mb-5 flex items-center justify-between"><BrandMark /><span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce9e1] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#528064]"><ShieldCheck className="h-3.5 w-3.5" /> Secure client upload</span></div>
      <div className="mb-5"><h1 className="text-[25px] font-medium tracking-[-.045em] text-[#233248] sm:text-[28px]">Upload documents</h1><p className="mt-1 text-[13px] text-[#8793a0]">{monthLabel(request.month)} · due {formatDate(request.dueDate)}</p><p className="mt-5 text-xs text-[#8491a0]">Documents for</p><h2 className="mt-0.5 text-[20px] font-medium tracking-[-.03em] text-[#33445a]">{clientName}</h2><p className="mt-1 text-xs text-[#8793a0]">{request.title} · Please upload the requested files and answer any questions below.</p></div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <form onSubmit={submit}>
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf1f3] px-4 py-3.5 sm:px-5"><h2 className="text-sm font-medium text-[#3d4d61]">Requested items</h2><span className="text-[11px] text-[#8793a0]">{completedCount} of {request.items.length} ready</span></div>
          <div className="divide-y divide-[#edf1f3]">{request.items.map((item, index) => <section key={item.itemId} className="p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.status !== 'requested' ? 'bg-[#eaf6ef] text-[#288456]' : 'border border-[#d9e4e7] text-[#9aa7b1]'}`}>{item.status !== 'requested' ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">{index + 1}</span>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[13px] font-medium text-[#39495d]">{item.label}</h3>{item.required && <span className="text-[10px] text-[#b06350]">Required</span>}<StatusBadge status={item.status} /></div><p className="mt-1 text-[11px] text-[#8995a2]">{item.kind === 'document' ? 'PDF, JPG or PNG · up to 20 MB' : 'Your answer is shared with your bookkeeper only.'}</p>
              {item.reviewNote && item.status === 'rejected' && <div className="mt-3 rounded-lg border border-[#f2dfd2] bg-[#fff9f5] px-3 py-2 text-xs text-[#946147]"><span className="font-medium">A note from your bookkeeper:</span> {item.reviewNote}</div>}
              {item.required === false && !success && <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-[#6f7e8d]"><input type="checkbox" checked={Boolean(notApplicable[item.itemId])} onChange={(event) => setNotApplicable((current) => ({ ...current, [item.itemId]: event.target.checked }))} className="h-4 w-4 accent-[#19875b]" /> This item doesn’t apply to me</label>}
              {!notApplicable[item.itemId] && item.kind === 'question' && <textarea rows={3} maxLength={2000} value={answers[item.itemId] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [item.itemId]: event.target.value }))} className={`${inputClass} mt-3 resize-y`} placeholder="Type your answer…" aria-label={item.label} />}
              {!notApplicable[item.itemId] && item.kind === 'document' && <div className="mt-3">
                <input ref={(element) => { fileInputs.current[item.itemId] = element }} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" aria-label={`Choose file for ${item.label}`} onChange={(event) => void uploadFile(item, event.currentTarget.files?.[0])} />
                <button type="button" disabled={uploading === item.itemId} onClick={() => fileInputs.current[item.itemId]?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadFile(item, event.dataTransfer.files[0]) }} className="focus-ring flex min-h-[86px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#b8d6c6] bg-[#fbfdfc] px-3 py-4 text-center transition hover:bg-[#f4faf6] disabled:opacity-60"><span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf6ef] text-[#298458]">{uploading === item.itemId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}</span><span className="text-xs font-medium text-[#526678]">{uploading === item.itemId ? 'Uploading securely…' : 'Choose files or drag them here'}</span><span className="mt-1 text-[10px] text-[#8e9ba7]">PDF, JPG or PNG · max 20 MB each</span></button>
                {item.files.length > 0 && <div className="mt-2 space-y-2">{item.files.map((file) => <div key={file.fileId} className="flex items-center gap-2 rounded-lg border border-[#e5ece8] bg-white px-3 py-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef7f2] text-[#3d875d]"><FileText className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate text-xs font-medium text-[#546477]">{file.originalName}</span><span className="text-[10px] text-[#96a1ab]">{formatSize(file.size)}</span></div>)}</div>}
              </div>}
            </div></div>
          </section>)}</div>
        </Panel>
        <div className="mt-4 rounded-lg border border-[#e4eaee] bg-white px-4 py-3 text-[11px] leading-5 text-[#82909d]"><ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-[#41835e]" />Your files are private and shared only with your bookkeeper. Upload links expire after 30 days.</div>
        <Button type="submit" disabled={submitting || Boolean(uploading)} className="mt-4 w-full"><CheckCircle2 className="h-4 w-4" />{submitting ? 'Sending securely…' : 'Submit documents and answers'}</Button>
      </form>
      <p className="mt-4 text-center text-[10px] text-[#a0aab4]">If something looks wrong, contact your bookkeeper.</p>
    </div>
  </main>
}

function BrandMark() {
  return <div className="flex items-center gap-2"><span className="flex h-[29px] w-[29px] items-center justify-center rounded-[9px] bg-[#eaf6ef] text-[#19875b]"><span className="h-[11px] w-[11px] rounded-[3px] border-[2px] border-current" /></span><span className="text-[19px] font-semibold tracking-[-.045em] text-[#203047]">ChaseList</span></div>
}

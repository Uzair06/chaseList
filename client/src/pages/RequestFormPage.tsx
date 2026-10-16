import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clipboard, FilePlus2, MessageSquareText, Plus, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Button, Field, inputClass, Panel, Spinner } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, monthLabel } from '../lib/format.ts'
import type { ClientRecord, ClientRequest } from '../types.ts'

interface DraftItem { key: string; label: string; kind: 'document' | 'question'; required: boolean }

export function RequestFormPage() {
  const { clientId = '' } = useParams()
  const [client, setClient] = useState<ClientRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ request: ClientRequest; shareUrl: string; email: string; companyName: string } | null>(null)
  const now = new Date()
  const monthDefault = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const due = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)
  const [month, setMonth] = useState(monthDefault)
  const [dueDate, setDueDate] = useState(`${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`)
  const [title, setTitle] = useState('Monthly documents')
  const [items, setItems] = useState<DraftItem[]>([
    { key: 'bank', label: 'Bank statement', kind: 'document', required: true },
    { key: 'receipts', label: 'Expense receipts', kind: 'document', required: true },
    { key: 'payroll', label: 'Payroll summary', kind: 'document', required: false },
    { key: 'answer', label: 'Anything else we should know?', kind: 'question', required: false },
  ])

  useEffect(() => {
    let active = true
    api<{ client: ClientRecord }>(`/clients/${clientId}`).then(({ client: value }) => { if (active) setClient(value) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this client.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [clientId])

  const emailHref = useMemo(() => {
    if (!created) return '#'
    const subject = `Documents requested for ${monthLabel(month)}`
    const body = `Hi ${client?.contactName ?? ''},\n\nPlease use this secure link to send your ${monthLabel(month)} documents and answers:\n${created.shareUrl}\n\nThe request is due ${formatDate(dueDate)}.\n\nThank you!`
    return `mailto:${created.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [created, month, client, dueDate])

  function addItem(kind: DraftItem['kind']) {
    setItems((current) => [...current, { key: `${Date.now()}-${Math.random()}`, label: '', kind, required: false }])
  }

  function updateItem(key: string, update: Partial<DraftItem>) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, ...update } : item))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('')
    const validItems = items.filter((item) => item.label.trim())
    if (validItems.length === 0) { setSaving(false); setError('Add at least one checklist item.'); return }
    try {
      const result = await api<{ request: ClientRequest; shareUrl: string; client: { email: string; companyName: string } }>('/requests', {
        method: 'POST', body: { clientId, month, title, dueDate, items: validItems.map(({ label, kind, required }) => ({ label, kind, required })) },
      })
      setCreated({ request: result.request, shareUrl: result.shareUrl, email: result.client.email, companyName: result.client.companyName })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create this request.') }
    finally { setSaving(false) }
  }

  async function copyLink() {
    if (!created) return
    try { await navigator.clipboard.writeText(created.shareUrl); setError('Link copied to clipboard.') }
    catch { setError('Clipboard access is unavailable. Select and copy the link below.') }
  }

  if (loading) return <Spinner label="Preparing request" />
  if (!client) return <div className="mx-auto max-w-2xl"><Alert>{error || 'Client not found.'}</Alert><Link to="/app/clients" className="mt-4 inline-block text-sm text-[#19875b]">Back to clients</Link></div>

  if (created) return <div className="mx-auto max-w-[760px]">
    <Link to={`/app/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-xs text-[#7b8997] hover:text-[#3f5065]"><ArrowLeft className="h-3.5 w-3.5" /> Back to {client.companyName}</Link>
    <Panel className="mt-5 p-6 sm:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf6ef] text-[#19875b]"><Check className="h-5 w-5" /></div>
      <h1 className="mt-5 text-[25px] font-medium tracking-[-.04em] text-[#233248]">Request created</h1>
      <p className="mt-2 text-sm leading-6 text-[#7d8997]">Your checklist for <span className="font-medium text-[#45556a]">{client.companyName}</span> is ready. Send the link yourself from your email app—ChaseList does not send email automatically.</p>
      <div className="mt-6 rounded-lg border border-[#e5eaee] bg-[#fafcfc] p-3 sm:p-4"><p className="text-xs font-medium text-[#667588]">Secure client upload link · expires {formatDate(created.request.expiresAt ?? '')}</p><div className="mt-2 flex gap-2"><input readOnly value={created.shareUrl} className={`${inputClass} min-w-0 bg-white text-xs`} onFocus={(event) => event.currentTarget.select()} /><Button type="button" variant="secondary" className="shrink-0 px-3" onClick={() => void copyLink()}><Clipboard className="h-4 w-4" /><span className="hidden sm:inline">Copy</span></Button></div></div>
      {error && <div className="mt-4"><Alert tone={error.includes('copied') ? 'success' : 'info'}>{error}</Alert></div>}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row"><a href={emailHref}><Button className="w-full sm:w-auto">Open email reminder <ArrowRight className="h-4 w-4" /></Button></a><Link to={`/app/requests/${created.request.id}`}><Button variant="secondary" className="w-full sm:w-auto">View request</Button></Link></div>
    </Panel>
  </div>

  return <div className="mx-auto max-w-[1080px]">
    <Link to={`/app/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-xs text-[#7b8997] hover:text-[#3f5065]"><ArrowLeft className="h-3.5 w-3.5" /> Back to {client.companyName}</Link>
    <div className="mt-4"><h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">Create a monthly request</h1><p className="mt-1 text-sm text-[#8491a0]">Choose what you need from {client.companyName}.</p></div>
    <form onSubmit={submit} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div className="space-y-5">
        <Panel className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf6ef] text-xs font-semibold text-[#337a57]">{client.companyName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><p className="text-sm font-medium text-[#34445a]">{client.companyName}</p><p className="mt-0.5 text-xs text-[#8793a0]">{client.contactName} · {client.email}</p></div></div></Panel>
        <Panel className="p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Request name"><input required maxLength={120} className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label="Month"><input required type="month" className={inputClass} value={month} onChange={(event) => setMonth(event.target.value)} /></Field><Field label="Due date"><input required type="date" className={inputClass} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field></div></Panel>
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-6"><div><h2 className="text-[16px] font-medium text-[#34445a]">Document checklist</h2><p className="mt-1 text-xs text-[#8995a2]">Add documents to upload or questions to answer.</p></div><span className="hidden rounded-full bg-[#f1f5f6] px-2.5 py-1 text-[11px] text-[#798695] sm:inline">{items.filter((item) => item.label.trim()).length} items</span></div>
          <div className="divide-y divide-[#edf1f3]">{items.map((item, index) => <div key={item.key} className="flex gap-3 px-4 py-4 sm:px-5"><span className="mt-3 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f6] text-[11px] text-[#8a97a4] sm:flex">{index + 1}</span><div className="min-w-0 flex-1"><input required maxLength={160} className={`${inputClass} font-medium`} placeholder={item.kind === 'document' ? 'Document to request' : 'Question for your client'} value={item.label} onChange={(event) => updateItem(item.key, { label: event.target.value })} /><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2"><span className="inline-flex items-center gap-1.5 text-[11px] text-[#8a97a4]">{item.kind === 'document' ? <FilePlus2 className="h-3.5 w-3.5" /> : <MessageSquareText className="h-3.5 w-3.5" />}{item.kind === 'document' ? 'File upload' : 'Client answer'}</span><label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-[#68788b]"><input type="checkbox" checked={item.required} onChange={(event) => updateItem(item.key, { required: event.target.checked })} className="accent-[#19875b]" /> Required</label></div></div><button type="button" title="Remove item" onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))} className="focus-ring mt-1 self-start rounded-md p-2 text-[#a0aab4] hover:bg-[#fff3f1] hover:text-[#b65a43]"><Trash2 className="h-4 w-4" /><span className="sr-only">Remove checklist item</span></button></div>)}</div>
          <div className="flex flex-col gap-2 border-t border-[#edf1f3] p-4 sm:flex-row"><Button type="button" variant="secondary" onClick={() => addItem('document')} className="justify-start"><Plus className="h-4 w-4" /> Add document request</Button><Button type="button" variant="secondary" onClick={() => addItem('question')} className="justify-start"><Plus className="h-4 w-4" /> Add a question</Button></div>
        </Panel>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row"><Link to={`/app/clients/${clientId}`}><Button type="button" variant="secondary" className="w-full sm:w-auto">Cancel</Button></Link><Button type="submit" disabled={saving} className="sm:min-w-48">{saving ? 'Creating…' : <>Create request <ArrowRight className="h-4 w-4" /></>}</Button></div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><Panel className="p-5"><h2 className="text-[15px] font-medium text-[#34445a]">Client preview</h2><p className="mt-1 text-xs text-[#8995a2]">This is what the secure upload page will ask.</p><div className="mt-4 space-y-2">{items.filter((item) => item.label.trim()).map((item) => <div key={item.key} className="flex items-start gap-2 rounded-lg bg-[#f8fafb] px-3 py-2.5"><span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-[#9cc8af]" /><span className="min-w-0 flex-1 text-xs text-[#526176]">{item.label}<span className="mt-1 block text-[10px] text-[#93a0ac]">{item.required ? 'Required' : 'Optional'} · {item.kind === 'document' ? 'File upload' : 'Answer'}</span></span></div>)}</div></Panel><div className="rounded-lg border border-[#e5eaee] bg-white px-4 py-3 text-xs leading-5 text-[#83909d]">Requests are created manually. You can copy the private link or prepare a reminder in your own email app after creation.</div></aside>
    </form>
  </div>
}

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarPlus, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, EmptyState, Panel, Spinner, StatusBadge } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, monthLabel } from '../lib/format.ts'
import type { ClientRecord, ClientRequest } from '../types.ts'

export function ClientDetailPage() {
  const { clientId = '' } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientRecord | null>(null)
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await api<{ client: ClientRecord; requests: ClientRequest[] }>(`/clients/${clientId}`)
      setClient(result.client); setRequests(result.requests)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this client.') }
    finally { setLoading(false) }
  }, [clientId])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function removeClient() {
    if (!client || !window.confirm(`Delete ${client.companyName} and all of their requests? This cannot be undone.`)) return
    setDeleting(true)
    try { await api(`/clients/${client.id}`, { method: 'DELETE' }); navigate('/app/clients') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete this client.'); setDeleting(false) }
  }

  if (loading) return <Spinner label="Loading client" />
  if (error && !client) return <div className="mx-auto max-w-2xl"><Alert>{error} <button onClick={() => void load()} className="ml-2 font-medium underline">Try again</button></Alert></div>
  if (!client) return null
  return <div>
    <Link to="/app/clients" className="inline-flex items-center gap-1.5 text-xs text-[#7b8997] hover:text-[#3f5065]"><ArrowLeft className="h-3.5 w-3.5" /> All clients</Link>
    <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">{client.companyName}</h1><StatusBadge status={requests.some((request) => !['completed'].includes(request.status)) ? 'Needs docs' : 'Active'} /></div><p className="mt-1 text-sm text-[#8491a0]">Client workspace</p></div>
      <div className="flex flex-wrap gap-2"><Link to={`/app/clients/${client.id}/edit`}><Button variant="secondary"><Pencil className="h-3.5 w-3.5" /> Edit</Button></Link><Link to={`/app/clients/${client.id}/requests/new`}><Button><Plus className="h-4 w-4" /> New monthly request</Button></Link></div>
    </div>
    {error && <div className="mt-5"><Alert>{error}</Alert></div>}
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#edf1f3] px-5 py-4"><div><h2 className="text-[16px] font-medium text-[#34445a]">Monthly requests</h2><p className="mt-1 text-xs text-[#8995a2]">{requests.length} {requests.length === 1 ? 'request' : 'requests'} so far</p></div><Link to={`/app/clients/${client.id}/requests/new`} className="text-xs font-medium text-[#19875b] hover:underline"><CalendarPlus className="mr-1 inline h-3.5 w-3.5" /> Create</Link></div>
        {requests.length === 0 ? <EmptyState title="No requests for this client" description="Create a monthly checklist to start collecting documents and answers." action={<Link to={`/app/clients/${client.id}/requests/new`}><Button><Plus className="h-4 w-4" /> Create a request</Button></Link>} /> : <div className="divide-y divide-[#edf1f3]">{requests.map((request) => <Link key={request.id} to={`/app/requests/${request.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fbfcfc]"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#39495d]">{request.title}</span><span className="mt-1 block text-xs text-[#8995a2]">{monthLabel(request.month)} · Due {formatDate(request.dueDate)}</span></span><StatusBadge status={request.status} /><ArrowRight className="h-4 w-4 shrink-0 text-[#9ca7b1]" /></Link>)}</div>}
      </Panel>
      <div className="space-y-4">
        <Panel className="p-5"><h2 className="text-[15px] font-medium text-[#34445a]">Contact</h2><div className="mt-4 space-y-3 text-sm"><p className="font-medium text-[#47576b]">{client.contactName}</p><a href={`mailto:${client.email}`} className="flex items-start gap-2 text-[#728092] hover:text-[#19875b]"><Mail className="mt-0.5 h-4 w-4 shrink-0" />{client.email}</a>{client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-[#728092] hover:text-[#19875b]"><Phone className="h-4 w-4" />{client.phone}</a>}</div></Panel>
        {client.notes && <Panel className="p-5"><h2 className="text-[15px] font-medium text-[#34445a]">Private notes</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#718092]">{client.notes}</p></Panel>}
        <Panel className="p-5"><h2 className="text-[15px] font-medium text-[#34445a]">Client actions</h2><p className="mt-2 text-xs leading-5 text-[#8995a2]">Deleting a client also deletes their monthly requests and stored files.</p><Button variant="danger" className="mt-4 w-full" disabled={deleting} onClick={() => void removeClient()}><Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete client'}</Button></Panel>
      </div>
    </div>
  </div>
}

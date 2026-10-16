import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, FileText, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, Button, EmptyState, inputClass, Panel, Spinner, StatusBadge } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, monthLabel } from '../lib/format.ts'
import type { ClientRequest } from '../types.ts'

export function RequestsPage() {
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setRequests((await api<{ requests: ClientRequest[] }>('/requests')).requests) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load requests.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  const filtered = useMemo(() => requests.filter((request) => `${request.title} ${request.client?.companyName ?? ''} ${request.month}`.toLowerCase().includes(query.toLowerCase())), [requests, query])

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">Requests</h1><p className="mt-1 text-[13px] text-[#8793a0]">Monthly checklists and document status across your clients.</p></div><Link to="/app/requests/new"><Button><Plus className="h-4 w-4" /> New request</Button></Link></div>
    {error && <div className="mt-6"><Alert>{error}<button onClick={() => void load()} className="ml-2 font-medium underline">Try again</button></Alert></div>}
    {loading ? <Spinner label="Loading requests" /> : !error && <Panel className="mt-7 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#edf1f3] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><label className="relative block w-full sm:max-w-[380px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa5b0]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search client or request" aria-label="Search requests" /></label><span className="text-xs text-[#8793a0]">{filtered.length} requests</span></div>
      {requests.length === 0 ? <EmptyState title="No requests yet" description="Create a monthly checklist from a client page. You can add document requests and questions." action={<Link to="/app/requests/new"><Button><Plus className="h-4 w-4" /> New request</Button></Link>} /> : filtered.length === 0 ? <EmptyState title="No matching requests" description="Try another client or request name." /> : <div className="divide-y divide-[#edf1f3]">{filtered.map((request) => <Link key={request.id} to={`/app/requests/${request.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-[#fbfcfc] sm:px-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f6f7] text-[#768697]"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#35455a]">{request.client?.companyName ?? 'Client'} <span className="font-normal text-[#8793a0]">· {request.title}</span></span><span className="mt-1 block truncate text-xs text-[#8995a2]">{monthLabel(request.month)} · {request.items.length} items · due {formatDate(request.dueDate)}</span></span><span className="hidden sm:inline-flex"><StatusBadge status={request.status} /></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a0aab4]" /></Link>)}</div>}
    </Panel>}
  </div>
}

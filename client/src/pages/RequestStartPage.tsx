import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, FilePlus2, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, Button, EmptyState, inputClass, Panel, Spinner } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import type { ClientRecord } from '../types.ts'

export function RequestStartPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setClients((await api<{ clients: ClientRecord[] }>('/clients')).clients) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load clients.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])
  const filtered = clients.filter((client) => `${client.companyName} ${client.contactName} ${client.email}`.toLowerCase().includes(query.toLowerCase()))

  return <div className="mx-auto max-w-[900px]">
    <h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">New monthly request</h1>
    <p className="mt-1 text-sm text-[#8491a0]">Choose a client to build their monthly checklist.</p>
    {error && <div className="mt-5"><Alert>{error}<button onClick={() => void load()} className="ml-2 font-medium underline">Try again</button></Alert></div>}
    {loading ? <Spinner label="Loading clients" /> : clients.length === 0 ? <Panel className="mt-6"><EmptyState title="Add a client first" description="Every request belongs to a client. Add their contact details, then build a monthly checklist." action={<Link to="/app/clients/new"><Button><Plus className="h-4 w-4" /> Add client</Button></Link>} /></Panel> : <>
      <label className="relative mt-6 block max-w-[430px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa5b0]" /><input className={`${inputClass} pl-9`} placeholder="Find a client" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <Panel className="mt-4 overflow-hidden"><div className="divide-y divide-[#edf1f3]">{filtered.map((client) => <Link key={client.id} to={`/app/clients/${client.id}/requests/new`} className="group flex items-center gap-3 px-4 py-4 hover:bg-[#fbfcfc] sm:px-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf6ef] text-xs font-semibold text-[#397e59]">{client.companyName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#36465b]">{client.companyName}</span><span className="mt-1 block truncate text-xs text-[#8995a2]">{client.contactName} · {client.email}</span></span><span className="hidden items-center gap-1.5 text-xs text-[#8793a0] sm:flex">Create checklist <FilePlus2 className="h-3.5 w-3.5" /></span><ArrowRight className="h-4 w-4 shrink-0 text-[#a0aab4] transition group-hover:translate-x-0.5 group-hover:text-[#19875b]" /></Link>)}{filtered.length === 0 && <EmptyState title="No matching clients" description="Try another name or email." />}</div></Panel>
    </>}
  </div>
}

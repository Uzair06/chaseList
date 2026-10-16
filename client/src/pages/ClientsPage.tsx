import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Mail, Plus, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, inputClass, Panel, Spinner, StatusBadge, Alert } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import type { ClientRecord } from '../types.ts'

export function ClientsPage() {
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
  const filtered = useMemo(() => clients.filter((client) => `${client.companyName} ${client.contactName} ${client.email}`.toLowerCase().includes(query.toLowerCase())), [clients, query])
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">Clients</h1><p className="mt-1 text-[13px] text-[#8793a0]">{today}</p></div><Link to="/app/clients/new"><Button><Plus className="h-4 w-4" /> Add client</Button></Link></div>
    {error && <div className="mt-6"><Alert>{error}<button className="ml-2 font-medium underline" onClick={() => void load()}>Try again</button></Alert></div>}
    {loading ? <Spinner label="Loading clients" /> : !error && <>
      <Panel className="mt-7 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#edf1f3] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="relative block w-full sm:max-w-[380px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa5b0]" /><input className={`${inputClass} pl-9`} placeholder="Search name, email, or company" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search clients" /></label>
          <span className="text-xs text-[#8793a0]">{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}</span>
        </div>
        {clients.length === 0 ? <EmptyState title="No clients yet" description="Add your first client to create monthly checklists and collect documents." action={<Link to="/app/clients/new"><Button><Plus className="h-4 w-4" /> Add client</Button></Link>} /> : filtered.length === 0 ? <EmptyState title="No matching clients" description="Try another name, email, or company." /> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[700px] text-left"><thead className="bg-[#fbfcfd]"><tr className="text-[10px] font-semibold tracking-[.1em] text-[#8b97a3]"><th className="px-5 py-3.5">CLIENT</th><th className="px-5 py-3.5">CONTACT</th><th className="px-5 py-3.5">OPEN REQUESTS</th><th className="px-5 py-3.5">STATUS</th><th className="w-8" /></tr></thead><tbody className="divide-y divide-[#edf1f3]">{filtered.map((client) => <tr key={client.id} className="group hover:bg-[#fbfcfc]"><td className="px-5 py-[17px]"><Link to={`/app/clients/${client.id}`} className="text-sm font-medium text-[#34445a] hover:text-[#19875b]">{client.companyName}</Link></td><td className="px-5 py-[17px]"><span className="block text-xs text-[#59697d]">{client.contactName}</span><span className="mt-1 block text-[11px] text-[#929eaa]">{client.email}</span></td><td className="px-5 py-[17px] text-sm text-[#526176]">{client.openRequests ?? 0}</td><td className="px-5 py-[17px]"><StatusBadge status={client.status ?? 'Active'} /></td><td className="pr-4"><Link to={`/app/clients/${client.id}`} aria-label={`View ${client.companyName}`}><ArrowRight className="h-4 w-4 text-[#a1acb6] group-hover:text-[#19875b]" /></Link></td></tr>)}</tbody></table></div>
          <div className="divide-y divide-[#edf1f3] md:hidden">{filtered.map((client) => <Link key={client.id} to={`/app/clients/${client.id}`} className="block px-4 py-4 hover:bg-[#fbfcfc]"><div className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block truncate text-[15px] font-medium text-[#34445a]">{client.companyName}</span><span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#8592a0]"><Mail className="h-3.5 w-3.5" />{client.email}</span></span><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#9aa5b0]" /></div><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-[#8995a2]">{client.openRequests ?? 0} open {client.openRequests === 1 ? 'request' : 'requests'}</span><StatusBadge status={client.status ?? 'Active'} /></div></Link>)}</div>
        </>}
      </Panel>
      {clients.length > 0 && <div className="mt-4 flex items-center gap-2 text-xs text-[#95a0ab]"><Users className="h-3.5 w-3.5" /> Client data is private to your workspace.</div>}
    </>}
  </div>
}

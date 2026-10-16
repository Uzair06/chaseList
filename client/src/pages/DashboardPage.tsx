import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, CalendarDays, CircleAlert, FileText, Plus, RotateCw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth-context.ts'
import { EmptyState, Panel, Spinner, StatusBadge, Button, Alert } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import { formatDate, monthLabel } from '../lib/format.ts'

interface DashboardData {
  metrics: { totalClients: number; pendingDocuments: number; completedRequests: number; overdueRequests: number }
  recentRequests: Array<{ id: string; clientId: string; clientName: string; title: string; month: string; dueDate: string; status: string; itemCount: number }>
  attention: Array<{ id: string; clientId: string; clientName: string; title: string; month: string; dueDate: string; status: string; itemCount: number }>
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await api<DashboardData>('/dashboard')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load your dashboard.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const firstName = user?.name.split(' ')[0] ?? 'there'
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  if (loading) return <Spinner label="Loading your workspace" />

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><h1 className="text-[27px] font-medium tracking-[-.045em] text-[#233248]">Dashboard</h1><p className="mt-1 text-[13px] text-[#8793a0]">{today}</p><p className="mt-5 text-[15px] text-[#4c5b6f]">Good morning, {firstName}</p></div>
      <Link to="/app/requests/new"><Button><Plus className="h-4 w-4" /> New request</Button></Link>
    </div>
    {error && <div className="mt-6"><Alert>{error} <button className="ml-2 font-medium underline" onClick={() => void load()}>Try again</button></Alert></div>}

    {!error && <>
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total clients', value: data?.metrics.totalClients ?? 0, note: 'In your workspace', icon: Users, tone: 'text-[#19875b] bg-[#eaf6ef]' },
          { label: 'Pending documents', value: data?.metrics.pendingDocuments ?? 0, note: 'Needs a client upload', icon: FileText, tone: 'text-[#19875b] bg-[#eaf6ef]' },
          { label: 'Completed requests', value: data?.metrics.completedRequests ?? 0, note: 'All time', icon: ArrowUpRight, tone: 'text-[#19875b] bg-[#eaf6ef]' },
          { label: 'Overdue requests', value: data?.metrics.overdueRequests ?? 0, note: 'Needs follow-up', icon: CircleAlert, tone: 'text-[#bf6550] bg-[#fff0ec]' },
        ].map(({ label, value, note, icon: Icon, tone }) => <Panel key={label} className="px-5 py-4">
          <div className="flex items-center justify-between"><p className="text-[13px] text-[#738192]">{label}</p><span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}><Icon className="h-3.5 w-3.5" /></span></div>
          <p className="mt-2 text-[30px] font-medium leading-none tracking-[-.05em] text-[#223249]">{value}</p><p className={`mt-3 text-xs ${label === 'Overdue requests' ? 'text-[#b65a43]' : 'text-[#7f8c9a]'}`}>{note}</p>
        </Panel>)}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-6"><div><h2 className="text-[17px] font-medium tracking-[-.02em] text-[#29394e]">Recent requests</h2><p className="mt-1 text-xs text-[#8995a2]">Track documents across your clients</p></div><Link className="inline-flex items-center gap-1 text-xs font-medium text-[#19875b] hover:text-[#126b46]" to="/app/requests">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          {(data?.recentRequests.length ?? 0) === 0 ? <EmptyState title="Your workspace is ready" description="Add a client and create a monthly request to start collecting documents." action={<Link to="/app/clients"><Button><Plus className="h-4 w-4" /> Add your first client</Button></Link>} /> : <div className="divide-y divide-[#edf1f3]">
            {data?.recentRequests.map((request) => <Link key={request.id} to={`/app/requests/${request.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fbfcfc] sm:px-6">
              <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-[#f2f6f7] text-[#768697] sm:flex"><FileText className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#35455a]">{request.clientName}</span><span className="mt-1 block truncate text-xs text-[#8995a2]">{request.title} · {monthLabel(request.month)}</span></span>
              <span className="hidden sm:block"><StatusBadge status={request.status} /></span>
              <span className="w-[54px] shrink-0 text-right text-xs text-[#7c8998]">{formatDate(request.dueDate)}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#a0aab4]" />
            </Link>)}
          </div>}
        </Panel>

        <Panel className="self-start">
          <div className="px-5 pb-4 pt-5"><h2 className="text-[17px] font-medium tracking-[-.02em] text-[#29394e]">Needs your attention</h2><p className="mt-1 text-xs text-[#8995a2]">{data?.attention.length ? `${data.attention.length} requests are past due` : 'You’re all caught up'}</p></div>
          {(data?.attention.length ?? 0) === 0 ? <div className="px-5 pb-6"><div className="flex items-center gap-3 rounded-lg bg-[#f5faf7] px-3 py-3 text-sm text-[#557664]"><CalendarDays className="h-4 w-4 shrink-0" /> No overdue requests</div></div> : <div className="divide-y divide-[#edf1f3]">
            {data?.attention.map((request) => <Link key={request.id} to={`/app/requests/${request.id}`} className="flex gap-3 px-5 py-4 hover:bg-[#fbfcfc]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d77c61]" /><span className="min-w-0"><span className="block truncate text-[13px] font-medium text-[#35455a]">{request.clientName}</span><span className="mt-1 block text-[11px] text-[#8995a2]">{request.title} · due {formatDate(request.dueDate)}</span></span></Link>)}
          </div>}
        </Panel>
      </div>
      <div className="mt-5 flex justify-end"><button className="inline-flex items-center gap-1.5 text-xs text-[#92a0ad] hover:text-[#526276]" onClick={() => void load()}><RotateCw className="h-3.5 w-3.5" /> Refresh dashboard</button></div>
    </>}
  </div>
}

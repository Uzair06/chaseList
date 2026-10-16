import { ArrowRight, Check, FileCheck2, FolderLock, Link2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/AppLayout.tsx'

export function LandingPage() {
  return <div className="min-h-screen bg-[#f7f9fb] text-[#172336]">
    <header className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8">
      <Brand landing />
      <nav className="flex items-center gap-3 sm:gap-7">
        <a href="#workflow" className="hidden text-sm text-[#647285] hover:text-[#22334a] sm:block">How it works</a>
        <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-[#536276] hover:text-[#1d2b3e]">Sign in</Link>
        <Link to="/register" className="rounded-lg bg-[#19875b] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#13764e]">Get started <span className="hidden sm:inline">free</span></Link>
      </nav>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-[.94fr_1.06fr] lg:gap-16 lg:pb-28 lg:pt-20">
        <div className="max-w-[560px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8e9df] bg-white px-3 py-1.5 text-xs font-medium text-[#337556]"><span className="h-1.5 w-1.5 rounded-full bg-[#39a56d]" /> Built for independent bookkeepers</div>
          <h1 className="max-w-[550px] text-[42px] font-medium leading-[1.08] tracking-[-.055em] text-[#1c2a3f] sm:text-[56px] lg:text-[62px]">Close the books.<br /><span className="text-[#19875b]">Not the inbox.</span></h1>
          <p className="mt-6 max-w-[490px] text-base leading-7 text-[#718092] sm:text-[17px]">ChaseList gives every client one clear checklist and a secure place to send documents—so month-end moves forward without the email chase.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#19875b] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#13764e]">Start organizing for free <ArrowRight className="h-4 w-4" /></Link>
            <a href="#workflow" className="inline-flex h-12 items-center justify-center rounded-lg border border-[#dce4e9] bg-white px-5 text-sm font-medium text-[#526176] hover:bg-[#fbfcfc]">See how it works</a>
          </div>
          <p className="mt-4 text-xs text-[#929eaa]">No card required · No client accounts needed</p>
        </div>

        <div className="relative mx-auto w-full max-w-[650px]">
          <div className="absolute -right-5 -top-6 h-36 w-36 rounded-full bg-[#e1f1e8] blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-[#e1e8ec] bg-white shadow-[0_24px_70px_rgba(37,61,80,.10)]">
            <div className="flex h-12 items-center justify-between border-b border-[#edf1f3] px-5"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#43a878]" /><span className="text-xs font-semibold text-[#344358]">Workspace preview</span></div><span className="text-[10px] font-medium tracking-[.08em] text-[#9aa5b0]">SAMPLE DATA · OCT 2026</span></div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
              {[["Total clients", "24", "+3 this month"], ["Pending docs", "18", "Across 7 clients"], ["Completed", "42", "This month"], ["Overdue", "3", "Needs follow-up"]].map(([label, value, note]) => <div key={label} className="rounded-lg border border-[#e9eef1] px-3 py-3"><p className="text-[10px] text-[#8491a0]">{label}</p><p className="mt-1 text-2xl font-medium tracking-[-.04em] text-[#26374d]">{value}</p><p className="mt-1 text-[9px] text-[#54a47a]">{note}</p></div>)}
            </div>
            <div className="px-4 pb-5 sm:px-5">
              <div className="flex items-end justify-between pb-3"><div><h2 className="text-sm font-semibold text-[#344358]">Recent requests</h2><p className="mt-1 text-[10px] text-[#98a3ae]">Track documents across your clients</p></div><span className="text-[10px] text-[#98a3ae]">3 latest</span></div>
              <div className="overflow-hidden rounded-lg border border-[#e9eef1]">
                {[["Northstar Studio", "Bank statement · Sep 2026", "Waiting on client"], ["Alder & Co.", "Receipt bundle · Q3 2026", "Overdue"], ["Morrow Design", "Payroll summary · Sep 2026", "In review"]].map(([name, detail, status], index) => <div key={name} className={`flex items-center justify-between gap-2 px-3 py-3 ${index ? 'border-t border-[#edf1f3]' : ''}`}><div><p className="text-[11px] font-medium text-[#39485c]">{name}</p><p className="mt-1 text-[9px] text-[#8b98a5]">{detail}</p></div><span className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] ${status === 'Overdue' ? 'bg-[#fff2ee] text-[#b85b45]' : status === 'In review' ? 'bg-[#f3effd] text-[#7256a5]' : 'bg-[#eef4f7] text-[#61788a]'}`}>{status}</span></div>)}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-[#e5ecef] bg-white px-4 py-3 shadow-lg sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf6ef] text-[#228456]"><Check className="h-5 w-5" /></div><div><p className="text-xs font-medium text-[#344358]">A client just submitted</p><p className="mt-1 text-[10px] text-[#8b98a5]">Northstar Studio · 2 files</p></div></div>
        </div>
      </section>

      <section id="workflow" className="border-y border-[#e8edf0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#19875b]">A calmer month-end</p><h2 className="mt-3 text-2xl font-medium tracking-[-.04em] text-[#233248] sm:text-3xl">Everything your clients need, in one place.</h2><p className="mt-3 text-sm leading-6 text-[#7b8897]">Keep requests clear for clients and easy to follow for you.</p></div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {[
              { icon: FileCheck2, title: 'Make a clear checklist', body: 'Create a monthly request with the documents and answers you need—nothing gets buried in a thread.' },
              { icon: Link2, title: 'Share one secure link', body: 'Clients upload from any device, no account required. Files stay private and encrypted.' },
              { icon: FolderLock, title: 'Review and move on', body: 'See what arrived, leave a note if something needs another look, and keep every client status visible.' },
            ].map(({ icon: Icon, title, body }) => <article key={title} className="max-w-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#19875b]"><Icon className="h-5 w-5" /></div><h3 className="text-sm font-semibold text-[#334257]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#7c8998]">{body}</p></article>)}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center sm:px-8 sm:py-16">
        <div><div className="flex items-center gap-2 text-sm font-medium text-[#19875b]"><ShieldCheck className="h-4 w-4" /> Private by design</div><h2 className="mt-3 text-2xl font-medium tracking-[-.04em] text-[#233248]">Bring a little order to month-end.</h2><p className="mt-2 text-sm text-[#7b8897]">Start with your first client request today.</p></div>
        <Link to="/register" className="focus-ring inline-flex h-11 items-center gap-2 rounded-lg bg-[#19875b] px-5 text-sm font-medium text-white hover:bg-[#13764e]">Create your workspace <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
    <footer className="border-t border-[#e5eaee] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#8995a2] sm:flex-row sm:items-center sm:justify-between sm:px-8"><Brand landing /><p>© {new Date().getFullYear()} ChaseList · Client documents, in order.</p></div></footer>
  </div>
}

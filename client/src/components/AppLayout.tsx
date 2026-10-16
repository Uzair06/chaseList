import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, LayoutDashboard, Menu, Users, X } from 'lucide-react'
import { useAuth } from '../auth-context.ts'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/requests', label: 'Requests', icon: FileText },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentLabel = location.pathname.includes('/clients') ? 'Clients' : location.pathname.includes('/requests') ? 'Requests' : 'Dashboard'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return <div className="min-h-screen bg-[#f7f9fb] text-[#172336]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[#e5eaee] bg-white lg:flex">
      <Brand />
      <div className="px-7 pb-3 pt-7 text-[10px] font-semibold tracking-[.13em] text-[#9aa5b0]">WORKSPACE</div>
      <nav className="space-y-1 px-3" aria-label="Main navigation">
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex h-10 items-center gap-3 rounded-lg px-4 text-sm transition ${isActive || (label === 'Clients' && location.pathname.includes('/clients')) || (label === 'Requests' && location.pathname.includes('/requests')) ? 'bg-[#eaf6ef] font-medium text-[#167a51]' : 'text-[#617083] hover:bg-[#f5f8f9]'}`}>
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />{label}
        </NavLink>)}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-[#edf0f2] px-6 py-5">
        <Avatar name={user?.name ?? 'Bookkeeper'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[#344255]">{user?.name}</p>
          <p className="truncate text-[11px] text-[#8c98a5]">Bookkeeper</p>
        </div>
        <button type="button" onClick={handleSignOut} title="Sign out" className="focus-ring rounded-md p-1.5 text-[#8894a2] hover:bg-[#f2f5f6] hover:text-[#3b4b5f]"><span className="sr-only">Sign out</span><ChevronRight className="h-4 w-4 rotate-180" /></button>
      </div>
    </aside>

    {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden">
      <button className="absolute inset-0 bg-[#142235]/35" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className="relative flex h-full w-[280px] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between"><Brand /><button onClick={() => setMobileOpen(false)} className="mr-4 rounded-lg p-2 text-[#607082]" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
        <div className="px-7 pb-3 pt-7 text-[10px] font-semibold tracking-[.13em] text-[#9aa5b0]">WORKSPACE</div>
        <nav className="space-y-1 px-3" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} onClick={() => setMobileOpen(false)} to={to} className={({ isActive }) => `flex h-11 items-center gap-3 rounded-lg px-4 text-sm ${isActive || (label === 'Clients' && location.pathname.includes('/clients')) || (label === 'Requests' && location.pathname.includes('/requests')) ? 'bg-[#eaf6ef] font-medium text-[#167a51]' : 'text-[#617083]'}`}><Icon className="h-[17px] w-[17px]" />{label}</NavLink>)}
        </nav>
        <button onClick={handleSignOut} className="mt-auto border-t px-6 py-5 text-left text-sm text-[#617083]">Sign out</button>
      </aside>
    </div>}

    <div className="min-h-screen lg:pl-[240px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e8edf0] bg-[#f7f9fb]/95 px-5 backdrop-blur sm:px-8 lg:px-[30px]">
        <div className="flex items-center gap-3 text-[13px] text-[#7c8998]">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="focus-ring -ml-2 rounded-lg p-2 text-[#4f6175] lg:hidden"><Menu className="h-5 w-5" /></button>
          <span className="hidden sm:inline">Workspace</span><ChevronRight className="hidden h-3.5 w-3.5 sm:inline" />
          <span className="font-medium text-[#405064]">{currentLabel}</span>
        </div>
        <Avatar name={user?.name ?? 'Bookkeeper'} small />
      </header>
      <main className="mx-auto max-w-[1440px] px-5 pb-12 pt-7 sm:px-8 lg:px-[30px] lg:pt-8"><Outlet /></main>
    </div>
  </div>
}

export function Brand({ landing = false }: { landing?: boolean }) {
  return <NavLink to={landing ? '/' : '/app/dashboard'} className={`flex items-center gap-2.5 ${landing ? 'px-0' : 'px-7 pt-6'}`}>
    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[#eaf6ef] text-[#19875b]"><span className="h-[12px] w-[12px] rounded-[3px] border-[2px] border-current" /></span>
    <span className="text-[20px] font-semibold tracking-[-.045em] text-[#203047]">ChaseList</span>
  </NavLink>
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#dff1e7] font-semibold text-[#36805d] ${small ? 'h-[30px] w-[30px] text-[10px]' : 'h-8 w-8 text-[11px]'}`}>{initials}</span>
}

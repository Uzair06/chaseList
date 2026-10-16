import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-[#19875b] text-white hover:bg-[#13764e] shadow-sm',
    secondary: 'border border-[#dce4e9] bg-white text-[#253449] hover:bg-[#f8fafb]',
    ghost: 'text-[#647285] hover:bg-[#f1f5f6] hover:text-[#26364a]',
    danger: 'border border-[#f1cecb] bg-white text-[#b23e39] hover:bg-[#fff5f4]',
  }
  return <button className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-55 ${variants[variant]} ${className}`} {...props}>{children}</button>
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#8190a0]" role="status"><LoaderCircle className="h-4 w-4 animate-spin" />{label}</div>
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const tones = {
    error: 'border-[#f2d3d1] bg-[#fff8f7] text-[#a6413c]',
    success: 'border-[#cde7d8] bg-[#f2faf5] text-[#24704c]',
    info: 'border-[#dce8ed] bg-[#f5fafc] text-[#536b7b]',
  }
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: 'bg-[#eef4f7] text-[#5c7384]',
    submitted: 'bg-[#eff5fd] text-[#4771aa]',
    in_review: 'bg-[#f3effd] text-[#7256a5]',
    completed: 'bg-[#eaf6ef] text-[#28734d]',
    overdue: 'bg-[#fff0ec] text-[#b65a43]',
    requested: 'bg-[#eef4f7] text-[#5c7384]',
    accepted: 'bg-[#eaf6ef] text-[#28734d]',
    rejected: 'bg-[#fff0ec] text-[#b65a43]',
    not_applicable: 'bg-[#f0f2f4] text-[#728091]',
    Active: 'bg-[#eaf6ef] text-[#28734d]',
    'Needs docs': 'bg-[#fff4e6] text-[#a26725]',
  }
  const label = status === 'in_review' ? 'In review' : status === 'not_applicable' ? 'Not applicable' : status === 'sent' ? 'Waiting on client' : status.replaceAll('_', ' ')
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${styles[status] ?? 'bg-[#eef2f5] text-[#667488]'}`}>{label}</span>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e5eaee] bg-white shadow-[0_1px_2px_rgba(20,40,60,0.025)] ${className}`}>{children}</section>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#eef7f2] text-[#19875b]">◌</div>
    <h3 className="text-sm font-semibold text-[#28374b]">{title}</h3>
    <p className="mt-1 max-w-sm text-sm leading-6 text-[#8491a0]">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className="block space-y-2">
    <span className="block text-sm font-medium text-[#3d4b5e]">{label}</span>
    {children}
    {hint && <span className="block text-xs text-[#8a97a4]">{hint}</span>}
    {error && <span className="block text-xs text-[#b23e39]">{error}</span>}
  </label>
}

export const inputClass = 'focus-ring w-full rounded-lg border border-[#dfe6eb] bg-white px-3.5 py-2.5 text-sm text-[#26364a] placeholder:text-[#a1acb8] outline-none transition focus:border-[#8bc8a8]'

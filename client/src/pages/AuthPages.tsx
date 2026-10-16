import { useState } from 'react'
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth-context.ts'
import { Brand } from '../components/AppLayout.tsx'
import { Alert, Button, Field, inputClass, Spinner } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import type { User } from '../types.ts'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  if (loading) return <Spinner />
  if (user) return <Navigate to="/app/dashboard" replace />

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api<{ user: User }>(`/auth/${mode}`, { method: 'POST', body: form })
      setUser(result.user)
      navigate('/app/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="flex min-h-screen flex-col bg-[#f7f9fb]">
    <header className="mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between px-5 sm:px-8"><Brand landing /><Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#758394] hover:text-[#26364a]"><ArrowLeft className="h-4 w-4" /> Back to home</Link></header>
    <div className="flex flex-1 items-center justify-center px-5 py-8">
      <section className="w-full max-w-[430px] rounded-2xl border border-[#e4eaee] bg-white p-6 shadow-[0_8px_32px_rgba(33,52,70,.04)] sm:p-9">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ef] text-[#19875b]"><LockKeyhole className="h-5 w-5" /></div>
        <h1 className="text-[26px] font-medium tracking-[-.045em] text-[#223149]">{isRegister ? 'Create your workspace' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#7d8997]">{isRegister ? 'A simpler way to keep your client documents moving.' : 'Sign in to see what your clients have sent.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {error && <Alert>{error}</Alert>}
          {isRegister && <Field label="Your name"><input required autoComplete="name" minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Morgan Lee" /></Field>}
          <Field label="Email address"><input required type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} placeholder="you@yourfirm.com" /></Field>
          <Field label="Password" hint={isRegister ? 'Use at least 10 characters.' : undefined}><input required type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 10 : 1} maxLength={128} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} placeholder={isRegister ? 'At least 10 characters' : 'Your password'} /></Field>
          <Button type="submit" disabled={busy} className="mt-2 w-full">{busy ? <><span className="animate-spin">◌</span> Working…</> : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight className="h-4 w-4" /></>}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#7d8997]">{isRegister ? 'Already have an account?' : 'New to ChaseList?'} <Link className="font-medium text-[#19875b] hover:underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
      </section>
    </div>
    <p className="pb-6 text-center text-[11px] text-[#9aa4ae]">Your workspace is private to you.</p>
  </main>
}

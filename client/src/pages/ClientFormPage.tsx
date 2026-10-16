import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Field, inputClass, Spinner } from '../components/ui.tsx'
import { api } from '../lib/api.ts'
import type { ClientFormValues, ClientRecord } from '../types.ts'

const emptyForm: ClientFormValues = { companyName: '', contactName: '', email: '', phone: '', notes: '' }

export function ClientFormPage() {
  const { clientId } = useParams()
  const isEdit = Boolean(clientId)
  const navigate = useNavigate()
  const [form, setForm] = useState<ClientFormValues>(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientId) return
    let active = true
    api<{ client: ClientRecord }>(`/clients/${clientId}`).then(({ client }) => {
      if (active) setForm({ companyName: client.companyName, contactName: client.contactName, email: client.email, phone: client.phone ?? '', notes: client.notes ?? '' })
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this client.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [clientId])

  function update(field: keyof ClientFormValues, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const result = await api<{ client: ClientRecord }>(isEdit ? `/clients/${clientId}` : '/clients', { method: isEdit ? 'PATCH' : 'POST', body: form })
      navigate(`/app/clients/${result.client.id}`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this client.') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner label="Loading client" />
  return <div className="mx-auto max-w-[760px]">
    <Link to={isEdit ? `/app/clients/${clientId}` : '/app/clients'} className="inline-flex items-center gap-1.5 text-xs text-[#7b8997] hover:text-[#3f5065]"><ArrowLeft className="h-3.5 w-3.5" /> {isEdit ? 'Back to client' : 'Back to clients'}</Link>
    <h1 className="mt-4 text-[27px] font-medium tracking-[-.045em] text-[#233248]">{isEdit ? 'Edit client' : 'Add a client'}</h1>
    <p className="mt-1 text-sm text-[#8491a0]">Keep your client contact details in one place.</p>
    <form onSubmit={submit} className="mt-6 rounded-xl border border-[#e5eaee] bg-white p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name"><input required maxLength={120} className={inputClass} placeholder="Northstar Studio" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} /></Field>
        <Field label="Contact name"><input required maxLength={100} className={inputClass} placeholder="Jamie Chen" value={form.contactName} onChange={(event) => update('contactName', event.target.value)} /></Field>
        <Field label="Email address"><input required type="email" maxLength={254} autoComplete="email" className={inputClass} placeholder="hello@northstar.co" value={form.email} onChange={(event) => update('email', event.target.value)} /></Field>
        <Field label="Phone number" hint="Optional"><input type="tel" maxLength={40} className={inputClass} placeholder="(555) 014-2200" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></Field>
      </div>
      <div className="mt-5"><Field label="Notes" hint="Only visible in your workspace"><textarea maxLength={2000} rows={4} className={`${inputClass} resize-y`} placeholder="Anything helpful to remember about this client…" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></Field></div>
      {error && <div className="mt-5"><Alert>{error}</Alert></div>}
      <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-[#edf1f3] pt-5 sm:flex-row"><Link to={isEdit ? `/app/clients/${clientId}` : '/app/clients'}><Button type="button" variant="secondary" className="w-full sm:w-auto">Cancel</Button></Link><Button type="submit" disabled={saving} className="sm:min-w-36">{saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save client</>}</Button></div>
    </form>
  </div>
}

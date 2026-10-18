interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData
  if (options.body !== undefined && !isFormData) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : isFormData ? options.body as FormData : JSON.stringify(options.body),
  })

  const payload = await response.json().catch(() => ({})) as { message?: string } & T
  if (!response.ok) throw new Error(payload.message ?? 'Something went wrong. Please try again.')
  return payload
}

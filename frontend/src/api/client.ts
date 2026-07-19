// Small typed fetch wrapper. Every backend error arrives as { "error": "msg" }
// (the shared convention across backend and engine), so failures surface as
// an ApiError with a human-readable message the UI can show directly.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const TOKEN_KEY = 'curastra_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 204) return undefined as T

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: string }).error)
        : `Request failed (${response.status}).`
    throw new ApiError(response.status, message)
  }
  return body as T
}

function jsonOptions(method: string, data?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, jsonOptions('POST', data)),
  patch: <T>(path: string, data?: unknown) => request<T>(path, jsonOptions('PATCH', data)),
  put: <T>(path: string, data?: unknown) => request<T>(path, jsonOptions('PUT', data)),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  /** URL for authenticated file fetches (used with fetch + blob for previews). */
  fileUrl: (path: string) => `${BASE}${path}`,
}

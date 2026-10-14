import type {
  Health,
  Item,
  ItemCreate,
  ItemUpdate,
  Sale,
  SaleCreate,
  SaleUpdate,
  SalesSummary,
} from '../types'

/**
 * Base URL of the FastAPI backend.
 *
 * - Local dev / Cloudflare Pages: empty string, so requests hit `/api/*` on the
 *   same origin and are proxied by Vite (dev) or the Pages Function (prod).
 * - Split deployment: set `VITE_API_BASE_URL` to the backend origin.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/+$/,
  '',
)

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

/** Append only meaningful query params to a path. */
function withQuery(
  path: string,
  params?: Record<string, string | boolean | undefined>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '' && value !== false) {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Without an explicit backend the path stays relative, so the Vite dev proxy
  // (or the Cloudflare Pages Function) forwards it to FastAPI.
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError(0, 'No se pudo contactar con el servidor. ¿Está el backend en marcha?')
  }

  if (response.status === 204) return undefined as T

  const raw = await response.text()
  const payload = raw ? safeJson(raw) : null

  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(payload, response.status))
  }
  return payload as T
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function extractDetail(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      // FastAPI validation errors: [{ loc, msg, type }, ...]
      const messages = detail
        .map((entry) => {
          if (entry && typeof entry === 'object' && 'msg' in entry) {
            return String((entry as { msg: unknown }).msg)
          }
          return null
        })
        .filter((msg): msg is string => Boolean(msg))
      if (messages.length) return messages.join('. ')
    }
  }
  return `Error ${status}`
}

export const api = {
  health: () => request<Health>('/api/health'),

  listItems: (options?: { onlyPending?: boolean; search?: string }) =>
    request<Item[]>(
      withQuery('/api/items', {
        only_pending: options?.onlyPending,
        search: options?.search,
      }),
    ),

  createItem: (payload: ItemCreate) =>
    request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (id: number, payload: ItemUpdate) =>
    request<Item>(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteItem: (id: number) =>
    request<void>(`/api/items/${id}`, { method: 'DELETE' }),

  clearCompleted: () =>
    request<{ deleted: number }>('/api/items', { method: 'DELETE' }),

  // --- sales ---------------------------------------------------------------

  listSales: (options?: { search?: string }) =>
    request<Sale[]>(withQuery('/api/sales', { search: options?.search })),

  salesSummary: () => request<SalesSummary>('/api/sales/summary'),

  createSale: (payload: SaleCreate) =>
    request<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSale: (id: number, payload: SaleUpdate) =>
    request<Sale>(`/api/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteSale: (id: number) =>
    request<void>(`/api/sales/${id}`, { method: 'DELETE' }),
}

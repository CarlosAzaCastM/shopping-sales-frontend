/**
 * Cloudflare Pages Function: transparent reverse proxy for the FastAPI backend.
 *
 * Pages serves everything under `functions/` at the matching path, so this file
 * handles `/api/*` on the same origin as the React app. That means the browser
 * never makes a cross-origin request, no CORS pre-flight is needed, and the
 * `DATABASE_URL` credential stays on the backend instead of in the bundle.
 *
 * Configure the target in the Cloudflare dashboard:
 *   Pages project -> Settings -> Environment variables -> BACKEND_URL
 * or in `wrangler.toml` under [vars].
 */
interface Env {
  /** Origin of the deployed FastAPI service, e.g. https://shopping-api.up.railway.app */
  BACKEND_URL?: string
}

const FALLBACK_BACKEND = 'http://127.0.0.1:8000'

export const onRequest: PagesFunction<Env> = async (context) => {
  const backend = (context.env.BACKEND_URL ?? FALLBACK_BACKEND).replace(/\/+$/, '')
  const incoming = new URL(context.request.url)
  const target = new URL(incoming.pathname + incoming.search, backend)

  // Forward the request, dropping hop-by-hop headers that must not be relayed.
  const headers = new Headers(context.request.headers)
  headers.delete('host')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')
  headers.delete('x-forwarded-proto')

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: 'manual',
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = await context.request.arrayBuffer()
  }

  const response = await fetch(target.toString(), init)

  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  responseHeaders.set('cache-control', 'no-store')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

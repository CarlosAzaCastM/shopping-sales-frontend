/* Cloudflare Pages Functions runtime types (subset we rely on). */
declare global {
  interface Env {
    [key: string]: unknown
  }

  interface PagesFunctionContext<E = Env> {
    request: Request
    env: E
    params: Record<string, string | string[]>
    next: () => Promise<Response>
    waitUntil: (promise: Promise<unknown>) => void
    data: Record<string, unknown>
  }

  type PagesFunction<E = Env> = (context: PagesFunctionContext<E>) => Response | Promise<Response>
}

export {}

import { useEffect, useState } from 'react'

import SalesView from './components/SalesView'
import ShoppingListView from './components/ShoppingListView'
import TabNav, { tabFromHash, type TabId } from './components/TabNav'
import { useSales } from './hooks/useSales'
import { useShoppingList } from './hooks/useShoppingList'
import { API_BASE_URL, api } from './lib/api'
import { CURRENCY_SYMBOL } from './lib/format'

type DbStatus = 'checking' | 'online' | 'offline'

export default function App() {
  const shopping = useShoppingList()
  const sales = useSales()

  const [tab, setTab] = useState<TabId>(() => tabFromHash())
  const [dbStatus, setDbStatus] = useState<DbStatus>('checking')
  const [dbVersion, setDbVersion] = useState<string | null>(null)

  // Keep the URL hash and the selected tab in sync, both ways.
  useEffect(() => {
    const syncFromHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  const selectTab = (next: TabId) => {
    setTab(next)
    window.location.hash = `#/${next}`
  }

  useEffect(() => {
    let cancelled = false
    api
      .health()
      .then((health) => {
        if (cancelled) return
        setDbStatus(health.database === 'ok' ? 'online' : 'offline')
        setDbVersion(health.server_version ?? null)
      })
      .catch(() => {
        if (!cancelled) setDbStatus('offline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const statusLabel =
    dbStatus === 'online'
      ? 'BD conectada'
      : dbStatus === 'offline'
        ? 'BD sin conexión'
        : 'Conectando…'

  return (
    <div className="app-backdrop min-h-dvh">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 text-xl shadow-lg shadow-sky-500/25">
                🛒
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                  Lista de Compras y Ventas
                </h1>
                <p className="text-sm text-slate-400">
                  React + Tailwind · FastAPI · PostgreSQL ·{' '}
                  <span className="font-medium text-slate-300">{CURRENCY_SYMBOL} MXN</span>
                </p>
              </div>
            </div>

            <span
              title={dbVersion ? `PostgreSQL ${dbVersion}` : statusLabel}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                dbStatus === 'online'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : dbStatus === 'offline'
                    ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                    : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  dbStatus === 'online'
                    ? 'bg-emerald-400'
                    : dbStatus === 'offline'
                      ? 'bg-rose-400'
                      : 'animate-pulse bg-slate-400'
                }`}
              />
              {statusLabel}
            </span>
          </div>
        </header>

        <TabNav
          active={tab}
          onChange={selectTab}
          pendingCount={shopping.pendingCount}
          salesCount={sales.totals.salesCount}
          profit={sales.totals.profit}
        />

        <main className="mt-6">
          {tab === 'lista' ? (
            <ShoppingListView shopping={shopping} />
          ) : (
            <SalesView sales={sales} stockAtCost={shopping.totals.totalCost} />
          )}
        </main>

        <p className="mt-8 text-center text-xs text-slate-600">
          API: <code className="text-slate-500">{API_BASE_URL || 'mismo origen (/api)'}</code>
        </p>
      </div>
    </div>
  )
}

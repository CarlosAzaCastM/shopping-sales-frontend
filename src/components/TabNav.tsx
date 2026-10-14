import { formatMoney } from '../lib/format'

export type TabId = 'lista' | 'ventas'

/** Read the tab from the URL hash so sections can be linked and reloaded. */
export function tabFromHash(): TabId {
  return window.location.hash.replace(/^#\/?/, '') === 'ventas' ? 'ventas' : 'lista'
}

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  pendingCount: number
  salesCount: number
  profit: number
}

export default function TabNav({
  active,
  onChange,
  pendingCount,
  salesCount,
  profit,
}: Props) {
  const base =
    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition'
  const on = 'bg-slate-800 text-slate-50 shadow-lg shadow-slate-950/40'
  const off = 'text-slate-400 hover:bg-white/5 hover:text-slate-200'

  return (
    <nav
      role="tablist"
      aria-label="Secciones"
      className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur"
    >
      <button
        type="button"
        role="tab"
        id="tab-lista"
        aria-selected={active === 'lista'}
        aria-controls="panel-lista"
        onClick={() => onChange('lista')}
        className={`${base} ${active === 'lista' ? on : off}`}
      >
        <span aria-hidden="true">📋</span>
        Lista de compras
        {pendingCount > 0 && (
          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-300">
            {pendingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        role="tab"
        id="tab-ventas"
        aria-selected={active === 'ventas'}
        aria-controls="panel-ventas"
        onClick={() => onChange('ventas')}
        className={`${base} ${active === 'ventas' ? on : off}`}
      >
        <span aria-hidden="true">💰</span>
        Ventas
        {salesCount > 0 && (
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
            {salesCount}
          </span>
        )}
        {salesCount > 0 && (
          <span
            className={`hidden tabular-nums sm:inline ${
              profit < 0 ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {profit < 0 ? '−' : '+'}
            {formatMoney(Math.abs(profit))}
          </span>
        )}
      </button>
    </nav>
  )
}

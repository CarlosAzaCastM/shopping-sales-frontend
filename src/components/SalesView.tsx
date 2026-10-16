import { useCallback, useMemo, useState } from 'react'

import AddSaleForm from './AddSaleForm'
import SaleRow from './SaleRow'
import SalesBreakdown from './SalesBreakdown'
import SalesSummaryCards from './SalesSummaryCards'
import { unitsFromSuggestions } from '../hooks/useProductSuggestions'
import type { UseSales } from '../hooks/useSales'
import { round2, toNumber } from '../lib/format'
import type { ProductSuggestion, SaleCreate } from '../types'

interface Props {
  sales: UseSales
  /** Units × cost for the items sitting on the shopping list. */
  stockAtCost: number
  suggestions: ProductSuggestion[]
  /** Avisa a App para que recargue el catálogo del autocompletado. */
  onCatalogChange: () => Promise<void>
}

export default function SalesView({
  sales,
  stockAtCost,
  suggestions,
  onCatalogChange,
}: Props) {
  const {
    sales: rows,
    totals,
    loading,
    error,
    busyIds,
    addSale,
    editSale,
    removeSale,
    refresh,
    dismissError,
  } = sales

  const [search, setSearch] = useState('')

  const usedUnits = useMemo(() => unitsFromSuggestions(suggestions), [suggestions])

  // Al registrar una venta, ese producto entra al catálogo del autocompletado.
  const handleAdd = useCallback(
    async (payload: SaleCreate) => {
      await addSale(payload)
      void onCatalogChange()
    },
    [addSale, onCatalogChange],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((sale) => sale.name.toLowerCase().includes(term))
  }, [rows, search])

  const visibleProfit = useMemo(
    () => round2(visible.reduce((sum, sale) => sum + toNumber(sale.profit), 0)),
    [visible],
  )

  return (
    <div className="space-y-6">
      <SalesSummaryCards totals={totals} />

      <AddSaleForm onAdd={handleAdd} suggestions={suggestions} />

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-danger-400/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded px-1 text-danger-300 transition hover:text-danger-100"
          >
            ✕
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Ventas registradas</h2>
            <p className="text-xs text-slate-500">
              {visible.length === rows.length
                ? `${rows.length} ${rows.length === 1 ? 'venta' : 'ventas'}`
                : `${visible.length} de ${rows.length} ventas`}
              {visible.length > 0 && (
                <>
                  {' · ganancia '}
                  <span
                    className={visibleProfit < 0 ? 'text-danger-300' : 'text-accent-300'}
                  >
                    {visibleProfit < 0 ? '−' : '+'}
                    {Math.abs(visibleProfit).toFixed(2)}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar venta…"
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30 sm:w-52"
            />
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? 'Cargando…' : 'Refrescar'}
            </button>
          </div>
        </div>

        <div className="p-3">
          {loading && rows.length === 0 ? (
            <ul className="space-y-2" aria-hidden="true">
              {[0, 1, 2].map((key) => (
                <li
                  key={key}
                  className="h-[74px] animate-pulse rounded-xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-slate-500">
              {rows.length === 0
                ? 'Aún no has registrado ventas. Usa el formulario de arriba para añadir la primera.'
                : 'Ninguna venta coincide con la búsqueda.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  busy={busyIds.has(sale.id)}
                  units={usedUnits}
                  onSave={editSale}
                  onDelete={removeSale}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <SalesBreakdown sales={rows} stockAtCost={stockAtCost} />
    </div>
  )
}

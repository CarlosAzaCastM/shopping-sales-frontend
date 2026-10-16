import { useMemo } from 'react'

import { formatDate, formatMoney } from '../lib/format'
import type { Sale } from '../types'

interface Props {
  sales: Sale[]
  /** Cost of the stock still on the shopping list (units × cost). */
  stockAtCost: number
}

export default function SalesBreakdown({ sales, stockAtCost }: Props) {
  const stats = useMemo(() => {
    if (sales.length === 0) {
      return { best: null as Sale | null, worst: null as Sale | null, avgMargin: 0 }
    }
    const best = sales.reduce((a, b) => (Number(b.profit) > Number(a.profit) ? b : a))
    const worst = sales.reduce((a, b) => (Number(b.profit) < Number(a.profit) ? b : a))
    const avgMargin = sales.reduce((sum, s) => sum + s.margin_pct, 0) / sales.length
    return { best, worst, avgMargin: Math.round(avgMargin * 100) / 100 }
  }, [sales])

  if (sales.length === 0) return null

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Resumen del negocio</h2>

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
          <dt className="text-slate-400">Margen promedio por venta</dt>
          <dd className="font-semibold tabular-nums text-slate-100">{stats.avgMargin}%</dd>
        </div>

        <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
          <dt className="text-slate-400">Valor del inventario en la lista</dt>
          <dd className="font-semibold tabular-nums text-sand-300">{formatMoney(stockAtCost)}</dd>
        </div>

        {stats.best && (
          <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
            <dt className="text-slate-400">Venta más rentable</dt>
            <dd className="text-right font-semibold text-accent-300">
              {stats.best.name}
              <span className="ml-2 tabular-nums">{formatMoney(stats.best.profit)}</span>
              <span className="ml-2 text-xs font-normal text-slate-500">
                {formatDate(stats.best.sold_at)}
              </span>
            </dd>
          </div>
        )}

        {stats.worst && Number(stats.worst.profit) < 0 && (
          <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
            <dt className="text-slate-400">Venta con pérdida</dt>
            <dd className="text-right font-semibold text-danger-300">
              {stats.worst.name}
              <span className="ml-2 tabular-nums">{formatMoney(stats.worst.profit)}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

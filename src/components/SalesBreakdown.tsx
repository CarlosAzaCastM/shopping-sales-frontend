import { useMemo } from 'react'

import DateRangeFilter from './DateRangeFilter'
import { describeRange, hasActiveRange } from '../lib/dateRange'
import type { DateRange } from '../lib/dateRange'
import { formatDate, formatMoney, round2, toNumber } from '../lib/format'
import type { Sale } from '../types'

interface Props {
  /** Ventas que entran en el resumen (ya filtradas por fecha). */
  sales: Sale[]
  /** Cost of the stock still on the shopping list (units × cost). */
  stockAtCost: number
  /** Total de ventas sin filtrar, para saber si el filtro está recortando. */
  totalSales: number
  range: DateRange
  onRangeChange: (range: DateRange) => void
}

export default function SalesBreakdown({
  sales,
  stockAtCost,
  totalSales,
  range,
  onRangeChange,
}: Props) {
  const stats = useMemo(() => {
    if (sales.length === 0) {
      return {
        best: null as Sale | null,
        worst: null as Sale | null,
        avgMargin: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      }
    }

    let revenue = 0
    let cost = 0
    for (const sale of sales) {
      revenue += toNumber(sale.total_revenue)
      cost += toNumber(sale.total_cost)
    }
    const profit = round2(revenue - cost)
    revenue = round2(revenue)
    cost = round2(cost)

    const best = sales.reduce((a, b) => (toNumber(b.profit) > toNumber(a.profit) ? b : a))
    const worst = sales.reduce((a, b) => (toNumber(b.profit) < toNumber(a.profit) ? b : a))
    const avgMargin = sales.reduce((sum, s) => sum + s.margin_pct, 0) / sales.length

    return {
      best,
      worst,
      avgMargin: Math.round(avgMargin * 100) / 100,
      revenue,
      cost,
      profit,
      margin: revenue > 0 ? round2((profit / revenue) * 100) : 0,
    }
  }, [sales])

  const filtered = hasActiveRange(range)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Resumen del negocio</h2>
          <p className="text-xs text-slate-500">
            {filtered
              ? `${sales.length} de ${totalSales} ventas · ${describeRange(range)}`
              : `${totalSales} ${totalSales === 1 ? 'venta' : 'ventas'} · todo el historial`}
          </p>
        </div>

        <DateRangeFilter value={range} onChange={onRangeChange} idPrefix="resumen" />
      </div>

      <div className="p-4 sm:p-5">
        {sales.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {totalSales === 0
              ? 'Aún no hay ventas que resumir.'
              : 'Ninguna venta cae dentro de ese rango de fechas.'}
          </p>
        ) : (
          <>
            {/* Cifras del rango elegido. */}
            <dl className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Ingresos
                </dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-brand-300">
                  {formatMoney(stats.revenue)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Costo
                </dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-sand-300">
                  {formatMoney(stats.cost)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {stats.profit < 0 ? 'Pérdida' : 'Ganancia'}
                </dt>
                <dd
                  className={`mt-0.5 text-lg font-bold tabular-nums ${
                    stats.profit < 0 ? 'text-danger-300' : 'text-accent-300'
                  }`}
                >
                  {formatMoney(Math.abs(stats.profit))}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Margen
                </dt>
                <dd
                  className={`mt-0.5 text-lg font-bold tabular-nums ${
                    stats.margin < 0 ? 'text-danger-300' : 'text-accent-300'
                  }`}
                >
                  {stats.margin}%
                </dd>
              </div>
            </dl>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
                <dt className="text-slate-400">Margen promedio por venta</dt>
                <dd className="font-semibold tabular-nums text-slate-100">{stats.avgMargin}%</dd>
              </div>

              <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
                <dt className="text-slate-400">Valor del inventario en la lista</dt>
                <dd className="font-semibold tabular-nums text-sand-300">
                  {formatMoney(stockAtCost)}
                </dd>
              </div>

              {stats.best && toNumber(stats.best.profit) > 0 && (
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

              {stats.worst && toNumber(stats.worst.profit) < 0 && (
                <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2">
                  <dt className="text-slate-400">Venta con pérdida</dt>
                  <dd className="text-right font-semibold text-danger-300">
                    {stats.worst.name}
                    <span className="ml-2 tabular-nums">{formatMoney(stats.worst.profit)}</span>
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {formatDate(stats.worst.sold_at)}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </div>
    </section>
  )
}

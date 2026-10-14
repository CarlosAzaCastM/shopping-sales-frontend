import { formatMoney } from '../lib/format'
import type { DerivedTotals } from '../hooks/useSales'

interface Props {
  totals: DerivedTotals
}

function Card({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

export default function SalesSummaryCards({ totals }: Props) {
  const profitable = totals.profit >= 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        label="Vendido (ingresos)"
        value={formatMoney(totals.totalRevenue)}
        hint={`${totals.salesCount} ${totals.salesCount === 1 ? 'venta' : 'ventas'} · ${totals.unitsSold} pzas`}
        accent="text-violet-300"
      />
      <Card
        label="Me costó"
        value={formatMoney(totals.totalCost)}
        hint="Costo total de lo vendido"
        accent="text-amber-300"
      />
      <Card
        label={profitable ? 'Ganancia' : 'Pérdida'}
        value={formatMoney(Math.abs(totals.profit))}
        hint={
          totals.bestSaleName
            ? `Mejor: ${totals.bestSaleName} (${formatMoney(totals.bestSaleProfit)})`
            : 'Sin ventas registradas'
        }
        accent={profitable ? 'text-emerald-300' : 'text-rose-300'}
      />
      <Card
        label="Margen de ganancia"
        value={`${totals.marginPct}%`}
        hint="Ganancia ÷ ingresos"
        accent={profitable ? 'text-emerald-300' : 'text-rose-300'}
      />
    </div>
  )
}

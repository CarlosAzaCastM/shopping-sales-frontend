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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-brand-500/30">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 bg-current opacity-70 ${accent}`}
      />
      <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
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
        accent="text-brand-300"
      />
      <Card
        label="Me costó"
        value={formatMoney(totals.totalCost)}
        hint="Costo total de lo vendido"
        accent="text-sand-300"
      />
      <Card
        label={profitable ? 'Ganancia' : 'Pérdida'}
        value={formatMoney(Math.abs(totals.profit))}
        hint={
          totals.bestSaleName
            ? `Mejor: ${totals.bestSaleName} (${formatMoney(totals.bestSaleProfit)})`
            : 'Sin ventas registradas'
        }
        accent={profitable ? 'text-accent-300' : 'text-danger-300'}
      />
      <Card
        label="Margen de ganancia"
        value={`${totals.marginPct}%`}
        hint="Ganancia ÷ ingresos"
        accent={profitable ? 'text-accent-300' : 'text-danger-300'}
      />
    </div>
  )
}

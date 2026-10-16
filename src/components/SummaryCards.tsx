import { formatMoney } from '../lib/format'
import type { Totals } from '../hooks/useShoppingList'

interface Props {
  totals: Totals
  pendingCount: number
  completedCount: number
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
  // `accent` solo define el color del número; la barrita toma ese mismo color
  // con `currentColor`, así cada tarjeta se identifica de un vistazo.
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

export default function SummaryCards({ totals, pendingCount, completedCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        label="Total estimado"
        value={formatMoney(totals.grand)}
        hint={`${totals.units} unidades en la lista`}
        accent="text-slate-100"
      />
      <Card
        label="Por comprar"
        value={formatMoney(totals.pending)}
        hint={`${pendingCount} ${pendingCount === 1 ? 'producto pendiente' : 'productos pendientes'}`}
        accent="text-brand-300"
      />
      <Card
        label="Comprado"
        value={formatMoney(totals.completed)}
        hint={`${completedCount} ${completedCount === 1 ? 'producto comprado' : 'productos comprados'}`}
        accent="text-accent-300"
      />
      <Card
        label="Progreso"
        value={`${
          pendingCount + completedCount === 0
            ? 0
            : Math.round((completedCount / (pendingCount + completedCount)) * 100)
        }%`}
        hint="Artículos completados"
        accent="text-brand-300"
      />
    </div>
  )
}

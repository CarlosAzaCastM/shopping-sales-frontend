import { useEffect, useState, type FormEvent } from 'react'

import { CURRENCY_SYMBOL, formatDate, formatMoney, toNumber } from '../lib/format'
import type { Sale, SaleUpdate } from '../types'

interface Props {
  sale: Sale
  busy: boolean
  onSave: (id: number, payload: SaleUpdate) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function SaleRow({ sale, busy, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(sale.name)
  const [quantity, setQuantity] = useState(String(sale.quantity))
  const [cost, setCost] = useState(toNumber(sale.cost).toFixed(2))
  const [salePrice, setSalePrice] = useState(toNumber(sale.sale_price).toFixed(2))
  const [soldAt, setSoldAt] = useState(sale.sold_at)

  useEffect(() => {
    if (editing) return
    setName(sale.name)
    setQuantity(String(sale.quantity))
    setCost(toNumber(sale.cost).toFixed(2))
    setSalePrice(toNumber(sale.sale_price).toFixed(2))
    setSoldAt(sale.sold_at)
  }, [editing, sale.name, sale.quantity, sale.cost, sale.sale_price, sale.sold_at])

  const profit = toNumber(sale.profit)
  const margin = sale.margin_pct
  const loss = profit < 0

  function cancelEdit() {
    setEditing(false)
    setName(sale.name)
    setQuantity(String(sale.quantity))
    setCost(toNumber(sale.cost).toFixed(2))
    setSalePrice(toNumber(sale.sale_price).toFixed(2))
    setSoldAt(sale.sold_at)
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    const units = Number.parseInt(quantity, 10)
    const unitCost = Number.parseFloat(cost)
    const unitPrice = Number.parseFloat(salePrice)

    if (!trimmed || !Number.isFinite(units) || units < 1) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return

    try {
      await onSave(sale.id, {
        name: trimmed,
        quantity: units,
        cost: Math.round(unitCost * 100) / 100,
        sale_price: Math.round(unitPrice * 100) / 100,
        sold_at: soldAt,
      })
      setEditing(false)
    } catch {
      // The hook surfaces the error; stay in edit mode so it can be retried.
    }
  }

  const labelClass = 'mb-1 block text-[11px] uppercase tracking-wide text-slate-400'
  const inputClass =
    'w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/30'

  if (editing) {
    return (
      <li className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-3">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="sm:col-span-2">
            <span className={labelClass}>Producto</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              autoFocus
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Cant.</span>
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min={1}
              step={1}
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Costo {CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              min={0}
              step="0.01"
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Venta {CURRENCY_SYMBOL}</span>
            <input
              type="number"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              min={0}
              step="0.01"
              className={inputClass}
            />
          </label>
          <label>
            <span className={labelClass}>Fecha</span>
            <input
              type="date"
              value={soldAt}
              onChange={(event) => setSoldAt(event.target.value)}
              className={inputClass}
            />
          </label>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li
      className={`rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 ${
        busy ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${
            loss ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'
          }`}
          title={loss ? 'Vendido por debajo del costo' : 'Venta con ganancia'}
        >
          {loss ? '▼' : '▲'}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="truncate text-sm font-semibold text-slate-100">{sale.name}</p>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400">
              {sale.quantity} pza{sale.quantity === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-slate-500">{formatDate(sale.sold_at)}</span>
          </div>

          {/* Per-unit breakdown, then the totals that matter. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-500">
              Me costó <span className="tabular-nums text-amber-300">{formatMoney(sale.cost)}</span>
              <span className="text-slate-600"> c/u</span>
            </span>
            <span className="text-slate-500">
              Vendido en{' '}
              <span className="tabular-nums text-slate-200">{formatMoney(sale.sale_price)}</span>
              <span className="text-slate-600"> c/u</span>
            </span>
            <span className="text-slate-500">
              Total{' '}
              <span className="tabular-nums text-violet-300">
                {formatMoney(sale.total_revenue)}
              </span>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-bold tabular-nums ${
              loss ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {loss ? '−' : '+'}
            {formatMoney(Math.abs(profit))}
          </p>
          <p className={`text-xs tabular-nums ${loss ? 'text-rose-400' : 'text-emerald-400'}`}>
            {margin}% margen
          </p>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy}
            aria-label={`Editar venta de ${sale.name}`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-100 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
              <path d="M12 20h9" strokeLinecap="round" />
              <path
                d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void onDelete(sale.id)}
            disabled={busy}
            aria-label={`Eliminar venta de ${sale.name}`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { CURRENCY_SYMBOL, formatMoney, marginPercent, todayIso } from '../lib/format'
import type { SaleCreate } from '../types'

interface Props {
  onAdd: (payload: SaleCreate) => Promise<void>
}

const EMPTY = { name: '', quantity: '1', cost: '', salePrice: '', soldAt: todayIso() }

export default function AddSaleForm({ onAdd }: Props) {
  const [name, setName] = useState(EMPTY.name)
  const [quantity, setQuantity] = useState(EMPTY.quantity)
  const [cost, setCost] = useState(EMPTY.cost)
  const [salePrice, setSalePrice] = useState(EMPTY.salePrice)
  const [soldAt, setSoldAt] = useState(EMPTY.soldAt)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!fieldError) return
    const timer = window.setTimeout(() => setFieldError(null), 4500)
    return () => window.clearTimeout(timer)
  }, [fieldError])

  const units = Number.parseInt(quantity, 10) || 0
  const unitCost = Number.parseFloat(cost) || 0
  const unitPrice = Number.parseFloat(salePrice) || 0

  // Live preview: what the sale will leave you, before you even save it.
  const preview = useMemo(() => {
    const totalCost = unitCost * units
    const totalRevenue = unitPrice * units
    const profit = totalRevenue - totalCost
    return {
      totalCost,
      totalRevenue,
      profit,
      margin: marginPercent(unitCost, unitPrice),
    }
  }, [unitCost, unitPrice, units])

  const hasPreview = units > 0 && (unitCost > 0 || unitPrice > 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setFieldError('Escribe el nombre del producto vendido.')
      return
    }
    if (units < 1) {
      setFieldError('La cantidad debe ser al menos 1.')
      return
    }
    if (unitCost < 0 || unitPrice < 0) {
      setFieldError('El costo y el precio de venta no pueden ser negativos.')
      return
    }
    if (!soldAt) {
      setFieldError('Indica la fecha de la venta.')
      return
    }

    setSubmitting(true)
    try {
      await onAdd({
        name: trimmed,
        quantity: units,
        cost: Math.round(unitCost * 100) / 100,
        sale_price: Math.round(unitPrice * 100) / 100,
        sold_at: soldAt,
      })
      setName(EMPTY.name)
      setQuantity(EMPTY.quantity)
      setCost(EMPTY.cost)
      setSalePrice(EMPTY.salePrice)
      setSoldAt(todayIso())
      setFieldError(null)
    } catch {
      // The hook shows the API error banner.
    } finally {
      setSubmitting(false)
    }
  }

  const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400'
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/30 backdrop-blur sm:p-5"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="grid size-6 place-items-center rounded-lg bg-brand-500/20 text-xs">＋</span>
        Registrar una venta
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="sm:col-span-2 lg:col-span-1">
          <span className={labelClass}>Producto</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Camiseta, gorra…"
            maxLength={255}
            autoComplete="off"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Cantidad</span>
          <input
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            min={1}
            step={1}
            inputMode="numeric"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Me costó ({CURRENCY_SYMBOL})</span>
          <input
            type="number"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Lo vendí en ({CURRENCY_SYMBOL})</span>
          <input
            type="number"
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
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
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasPreview ? (
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Ingreso total</dt>
              <dd className="font-semibold tabular-nums text-slate-200">
                {formatMoney(preview.totalRevenue)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Costo total</dt>
              <dd className="font-semibold tabular-nums text-sand-300">
                {formatMoney(preview.totalCost)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Ganancia</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  preview.profit < 0 ? 'text-danger-300' : 'text-accent-300'
                }`}
              >
                {formatMoney(preview.profit)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Margen</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  preview.margin < 0 ? 'text-danger-300' : 'text-accent-300'
                }`}
              >
                {preview.margin}%
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-slate-500">
            Al escribir el costo y el precio verás aquí la ganancia y el margen.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Guardando…' : 'Registrar venta'}
        </button>
      </div>

      {fieldError && (
        <p role="alert" className="mt-3 text-sm text-sand-300">
          {fieldError}
        </p>
      )}
    </form>
  )
}

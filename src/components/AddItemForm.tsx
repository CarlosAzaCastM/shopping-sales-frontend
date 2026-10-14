import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { CURRENCY_SYMBOL, formatMoney } from '../lib/format'
import type { ItemCreate } from '../types'

interface Props {
  onAdd: (payload: ItemCreate) => Promise<void>
}

const EMPTY = { name: '', quantity: '1', price: '', cost: '' }

export default function AddItemForm({ onAdd }: Props) {
  const [name, setName] = useState(EMPTY.name)
  const [quantity, setQuantity] = useState(EMPTY.quantity)
  const [price, setPrice] = useState(EMPTY.price)
  const [cost, setCost] = useState(EMPTY.cost)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!fieldError) return
    const timer = window.setTimeout(() => setFieldError(null), 4000)
    return () => window.clearTimeout(timer)
  }, [fieldError])

  const units = Number.parseInt(quantity, 10) || 0
  const unitPrice = Number.parseFloat(price) || 0
  const unitCost = Number.parseFloat(cost) || 0

  const preview = useMemo(() => {
    const revenue = unitPrice * units
    const spend = unitCost * units
    return { revenue, spend, profit: revenue - spend }
  }, [unitPrice, unitCost, units])

  const hasPreview = units > 0 && (unitPrice > 0 || unitCost > 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setFieldError('Escribe el nombre del producto.')
      return
    }
    if (units < 1) {
      setFieldError('La cantidad debe ser un número mayor o igual a 1.')
      return
    }
    if (unitPrice < 0 || unitCost < 0) {
      setFieldError('El precio y el costo deben ser números positivos.')
      return
    }

    setSubmitting(true)
    try {
      await onAdd({
        name: trimmed,
        quantity: units,
        price: Math.round(unitPrice * 100) / 100,
        cost: Math.round(unitCost * 100) / 100,
      })
      setName(EMPTY.name)
      setQuantity(EMPTY.quantity)
      setPrice(EMPTY.price)
      setCost(EMPTY.cost)
      setFieldError(null)
    } catch {
      // The parent hook already surfaces the API error banner.
    } finally {
      setSubmitting(false)
    }
  }

  const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400'
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/30 backdrop-blur sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="sm:col-span-2 lg:col-span-2">
          <span className={labelClass}>Producto</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Leche, pan, manzanas…"
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
          <span className={labelClass}>Precio venta ({CURRENCY_SYMBOL})</span>
          <input
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
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
            className={`${inputClass} focus:border-amber-400/70 focus:ring-amber-400/30`}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasPreview ? (
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Compra</dt>
              <dd className="font-semibold tabular-nums text-amber-300">
                {formatMoney(preview.spend)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Venta</dt>
              <dd className="font-semibold tabular-nums text-slate-200">
                {formatMoney(preview.revenue)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Ganancia si lo vendes</dt>
              <dd
                className={`font-semibold tabular-nums ${
                  preview.profit < 0 ? 'text-rose-300' : 'text-emerald-300'
                }`}
              >
                {formatMoney(preview.profit)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-slate-500">
            Opcional: pon lo que te costó y el precio de venta para ver tu ganancia.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Añadiendo…' : 'Añadir a la lista'}
        </button>
      </div>

      {fieldError && (
        <p role="alert" className="mt-3 text-sm text-amber-300">
          {fieldError}
        </p>
      )}
    </form>
  )
}

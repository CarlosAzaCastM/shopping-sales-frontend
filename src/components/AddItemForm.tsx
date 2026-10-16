import { useEffect, useMemo, useState, type FormEvent } from 'react'

import ProductNameField from './ProductNameField'
import UnitField from './UnitField'
import { CURRENCY_SYMBOL, formatMoney, round2 } from '../lib/format'
import { unitsFromSuggestions } from '../hooks/useProductSuggestions'
import { DEFAULT_UNIT, type ItemCreate, type ProductSuggestion } from '../types'

interface Props {
  onAdd: (payload: ItemCreate) => Promise<void>
  suggestions: ProductSuggestion[]
}

const EMPTY = { name: '', quantity: '1', price: '', unit: DEFAULT_UNIT }

export default function AddItemForm({ onAdd, suggestions }: Props) {
  const [name, setName] = useState(EMPTY.name)
  const [quantity, setQuantity] = useState(EMPTY.quantity)
  const [price, setPrice] = useState(EMPTY.price)
  const [unit, setUnit] = useState(EMPTY.unit)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    if (!fieldError) return
    const timer = window.setTimeout(() => setFieldError(null), 4000)
    return () => window.clearTimeout(timer)
  }, [fieldError])

  // Unidades ya usadas en el historial, para ofrecerlas primero.
  const usedUnits = useMemo(() => unitsFromSuggestions(suggestions), [suggestions])

  const unitsTotal = Number.parseInt(quantity, 10) || 0
  const unitPrice = Number.parseFloat(price) || 0
  const lineTotal = round2(unitPrice * unitsTotal)

  /** Al elegir un producto conocido, prellenamos unidad y precio de compra. */
  function handlePick(suggestion: ProductSuggestion) {
    setUnit(suggestion.unit || DEFAULT_UNIT)
    const lastPrice = Number.parseFloat(String(suggestion.last_price ?? '0'))
    if (lastPrice > 0) {
      setPrice(lastPrice.toFixed(2))
      setPrefilled(true)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setFieldError('Escribe el nombre del producto.')
      return
    }
    if (unitsTotal < 1) {
      setFieldError('La cantidad debe ser un número mayor o igual a 1.')
      return
    }
    if (unitPrice < 0) {
      setFieldError('El precio de compra debe ser un número positivo.')
      return
    }
    if (!unit.trim()) {
      setFieldError('Indica la unidad (pza, kg, L…).')
      return
    }

    setSubmitting(true)
    try {
      await onAdd({
        name: trimmed,
        quantity: unitsTotal,
        price: round2(unitPrice),
        unit: unit.trim(),
      })
      setName(EMPTY.name)
      setQuantity(EMPTY.quantity)
      setPrice(EMPTY.price)
      setUnit(EMPTY.unit)
      setPrefilled(false)
      setFieldError(null)
    } catch {
      // The parent hook already surfaces the API error banner.
    } finally {
      setSubmitting(false)
    }
  }

  const labelClass = 'mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase'
  const inputClass =
    'w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/30 backdrop-blur sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProductNameField
          value={name}
          onChange={setName}
          onPick={handlePick}
          suggestions={suggestions}
          className="sm:col-span-2 lg:col-span-1"
        />

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

        <UnitField value={unit} onChange={setUnit} extraUnits={usedUnits} />

        <label>
          <span className={labelClass}>Precio compra ({CURRENCY_SYMBOL})</span>
          <input
            type="number"
            value={price}
            onChange={(event) => {
              setPrice(event.target.value)
              setPrefilled(false)
            }}
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className={`${inputClass} focus:border-sand-400/70 focus:ring-sand-400/30`}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {unitsTotal > 0 && unitPrice > 0 ? (
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">Total de la compra</dt>
              <dd className="font-bold tabular-nums text-brand-300">{formatMoney(lineTotal)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-slate-500">
                {unitsTotal} {unit} ×
              </dt>
              <dd className="font-semibold tabular-nums text-sand-300">{formatMoney(unitPrice)}</dd>
            </div>
            {prefilled && (
              <span className="rounded bg-accent-500/15 px-1.5 py-0.5 text-accent-300">
                unidad y precio recuperados del historial
              </span>
            )}
          </dl>
        ) : (
          <p className="text-xs text-slate-500">
            Escribe un producto ya usado y se rellenan su unidad y su último precio de compra.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Añadiendo…' : 'Añadir a la lista'}
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

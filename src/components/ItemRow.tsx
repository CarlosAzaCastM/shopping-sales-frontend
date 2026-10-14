import { useEffect, useState, type FormEvent } from 'react'

import { formatDate, formatMoney, toNumber } from '../lib/format'
import type { Item, ItemUpdate } from '../types'

interface Props {
  item: Item
  busy: boolean
  onToggle: (item: Item) => Promise<void>
  onSave: (id: number, payload: ItemUpdate) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function ItemRow({ item, busy, onToggle, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [price, setPrice] = useState(toNumber(item.price).toFixed(2))
  const [cost, setCost] = useState(toNumber(item.cost).toFixed(2))

  // Keep the draft in sync when the row changes from outside (e.g. optimistic
  // rollback after a failed request).
  useEffect(() => {
    if (editing) return
    setName(item.name)
    setQuantity(String(item.quantity))
    setPrice(toNumber(item.price).toFixed(2))
    setCost(toNumber(item.cost).toFixed(2))
  }, [editing, item.name, item.quantity, item.price, item.cost])

  const lineTotal = toNumber(item.price) * (item.quantity || 0)

  function cancelEdit() {
    setEditing(false)
    setName(item.name)
    setQuantity(String(item.quantity))
    setPrice(toNumber(item.price).toFixed(2))
    setCost(toNumber(item.cost).toFixed(2))
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    const parsedQuantity = Number.parseInt(quantity, 10)
    const parsedPrice = Number.parseFloat(price)
    const parsedCost = cost.trim() === '' ? 0 : Number.parseFloat(cost)

    if (!trimmed || !Number.isFinite(parsedQuantity) || parsedQuantity < 1) return
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return
    if (!Number.isFinite(parsedCost) || parsedCost < 0) return

    try {
      await onSave(item.id, {
        name: trimmed,
        quantity: parsedQuantity,
        price: Math.round(parsedPrice * 100) / 100,
        cost: Math.round(parsedCost * 100) / 100,
      })
      setEditing(false)
    } catch {
      // Error banner is handled by the hook; stay in edit mode so the user can retry.
    }
  }

  return (
    <li
      className={`group rounded-xl border transition ${
        item.is_completed
          ? 'border-white/5 bg-white/[0.02]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      } ${busy ? 'opacity-60' : ''}`}
    >
      {editing ? (
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <label className="flex-1 sm:min-w-[10rem]">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              Producto
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
          <label className="sm:w-20">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              Cant.
            </span>
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min={1}
              step={1}
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
          <label className="sm:w-28">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              Precio venta
            </span>
            <input
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              min={0}
              step="0.01"
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
          <label className="sm:w-28">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
              Me costó
            </span>
            <input
              type="number"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              min={0}
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/30"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-white/10 px-3.5 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
          {/* Explicit action button: the old checkbox was too easy to miss. */}
          <button
            type="button"
            onClick={() => void onToggle(item)}
            disabled={busy}
            aria-pressed={item.is_completed}
            aria-label={
              item.is_completed
                ? `Marcar ${item.name} como pendiente`
                : `Marcar ${item.name} como comprado`
            }
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              item.is_completed
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-white/15 bg-white/5 text-slate-300 hover:border-emerald-400/50 hover:bg-emerald-500/15 hover:text-emerald-200'
            }`}
          >
            {item.is_completed ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Comprado
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.2L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Comprar
              </>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${
                item.is_completed ? 'text-slate-500 line-through' : 'text-slate-100'
              }`}
              title={item.name}
            >
              {item.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {item.quantity} × {formatMoney(item.price)}
              {toNumber(item.cost) > 0 && (
                <>
                  {' · costo '}
                  <span className="text-amber-300/80">{formatMoney(item.cost)}</span>
                </>
              )}
              {' · '}
              {formatDate(item.created_at)}
            </p>
          </div>

          <span
            className={`hidden shrink-0 text-sm font-semibold tabular-nums sm:block ${
              item.is_completed ? 'text-slate-500' : 'text-sky-300'
            }`}
          >
            {formatMoney(lineTotal)}
          </span>

          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              aria-label={`Editar ${item.name}`}
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
              onClick={() => void onDelete(item.id)}
              disabled={busy}
              aria-label={`Eliminar ${item.name}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11v6M14 11v6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

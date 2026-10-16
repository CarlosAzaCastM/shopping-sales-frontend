import { useCallback, useMemo, useState } from 'react'

import AddItemForm from './AddItemForm'
import ItemRow from './ItemRow'
import SummaryCards from './SummaryCards'
import { unitsFromSuggestions } from '../hooks/useProductSuggestions'
import type { UseShoppingList } from '../hooks/useShoppingList'
import type { ItemCreate, ProductSuggestion } from '../types'

type Filter = 'all' | 'pending' | 'completed'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Por comprar' },
  { id: 'completed', label: 'Comprados' },
]

interface Props {
  shopping: UseShoppingList
  suggestions: ProductSuggestion[]
  /** Avisa a App para que recargue el catálogo del autocompletado. */
  onCatalogChange: () => Promise<void>
}

export default function ShoppingListView({ shopping, suggestions, onCatalogChange }: Props) {
  const {
    items,
    loading,
    error,
    busyIds,
    totals,
    pendingCount,
    completedCount,
    addItem,
    editItem,
    toggleItem,
    removeItem,
    clearCompleted,
    refresh,
    dismissError,
  } = shopping

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const usedUnits = useMemo(() => unitsFromSuggestions(suggestions), [suggestions])

  // Al añadir, el nombre nuevo entra al catálogo del autocompletado.
  const handleAdd = useCallback(
    async (payload: ItemCreate) => {
      await addItem(payload)
      void onCatalogChange()
    },
    [addItem, onCatalogChange],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'pending' && item.is_completed) return false
      if (filter === 'completed' && !item.is_completed) return false
      if (term && !item.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [items, filter, search])

  return (
    <div className="space-y-6" id="panel-lista" role="tabpanel" aria-labelledby="tab-lista">
      <SummaryCards totals={totals} pendingCount={pendingCount} completedCount={completedCount} />

      <AddItemForm onAdd={handleAdd} suggestions={suggestions} />

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-danger-400/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded px-1 text-danger-300 transition hover:text-danger-100"
          >
            ✕
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-slate-900/60 p-1">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFilter(entry.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === entry.id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto…"
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30 sm:w-44"
            />
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? 'Cargando…' : 'Refrescar'}
            </button>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => void clearCompleted()}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-danger-400/50 hover:bg-danger-500/10 hover:text-danger-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="p-3">
          {loading && items.length === 0 ? (
            <ul className="space-y-2" aria-hidden="true">
              {[0, 1, 2].map((key) => (
                <li
                  key={key}
                  className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-slate-500">
              {items.length === 0
                ? 'Tu lista está vacía. Añade el primer producto arriba.'
                : 'Ningún producto coincide con el filtro o la búsqueda.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  busy={busyIds.has(item.id)}
                  units={usedUnits}
                  onToggle={toggleItem}
                  onSave={editItem}
                  onDelete={removeItem}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

import { useId, useMemo } from 'react'

import type { ProductSuggestion } from '../types'
import { findSuggestion, normalizeName } from '../hooks/useProductSuggestions'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Se dispara al elegir un producto del catálogo (nombre exacto). */
  onPick?: (suggestion: ProductSuggestion) => void
  suggestions: ProductSuggestion[]
  placeholder?: string
  label?: string
  /** id del `<datalist>`; si se omite se genera uno único. */
  listId?: string
  autoFocus?: boolean
  className?: string
}

/**
 * Campo de producto con autocompletado.
 *
 * Usa un `<datalist>` nativo: el navegador filtra las opciones mientras
 * escribes y funciona igual en móvil. Cuando el texto coincide exactamente con
 * un producto del catálogo, avisa por `onPick` para prellenar unidad y precio.
 *
 * El catálogo incluye productos de la lista de compras y de las ventas, así que
 * un producto antiguo sigue apareciendo aunque ya no esté en la lista.
 */
export default function ProductNameField({
  value,
  onChange,
  onPick,
  suggestions,
  placeholder = 'Leche, pan, manzanas…',
  label = 'Producto',
  listId,
  autoFocus = false,
  className = '',
}: Props) {
  const generatedId = useId()
  const datalistId = listId ?? `productos-${generatedId}`

  // Orden alfabético para que la lista desplegable sea predecible, e índice por
  // nombre normalizado para resolver la coincidencia sin recorrer el array.
  const { options, index } = useMemo(() => {
    const sorted = [...suggestions].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    )
    const map = new Map<string, ProductSuggestion>()
    for (const item of sorted) {
      const key = normalizeName(item.name)
      if (key && !map.has(key)) map.set(key, item)
    }
    return { options: sorted, index: map }
  }, [suggestions])

  /** Si el texto ya es un producto conocido, avisa para prellenar el resto. */
  function maybePick(next: string) {
    if (!onPick) return
    const match = findSuggestion(index, next)
    if (match) onPick(match)
  }

  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          // Elegir una opción del datalist dispara `input` de inmediato, así que
          // detectamos aquí para que unidad y precio se rellenen al momento.
          maybePick(event.target.value)
        }}
        onBlur={(event) => maybePick(event.target.value)}
        list={datalistId}
        placeholder={placeholder}
        maxLength={255}
        autoComplete="off"
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30"
      />
      <datalist id={datalistId}>
        {options.map((item) => (
          <option key={normalizeName(item.name)} value={item.name} />
        ))}
      </datalist>
    </label>
  )
}

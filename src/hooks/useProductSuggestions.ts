import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, api } from '../lib/api'
import { DEFAULT_UNIT, type ProductSuggestion } from '../types'

export interface UseProductSuggestions {
  suggestions: ProductSuggestion[]
  loading: boolean
  /** Vuelve a leer el catálogo (tras añadir un producto nuevo). */
  refresh: () => Promise<void>
  /** Índice por nombre normalizado, para prellenar unidad y precio. */
  byName: Map<string, ProductSuggestion>
}

/** Normaliza para comparar: sin espacios sobrantes y en minúsculas. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'No se pudieron cargar las sugerencias.'
}

/**
 * Catálogo de nombres de producto ya usados, para el autocompletado.
 *
 * Vive en `App` y se pasa a los dos formularios, así que al añadir un producto
 * en la lista aparece de inmediato como sugerencia en ventas (y al revés).
 */
export function useProductSuggestions(): UseProductSuggestions {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSuggestions(await api.productNames())
    } catch (error) {
      // El autocompletado es una ayuda: si falla, los formularios siguen
      // funcionando como campos de texto normales.
      console.warn('Autocompletado no disponible:', messageOf(error))
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const byName = useMemo(() => {
    const index = new Map<string, ProductSuggestion>()
    for (const suggestion of suggestions) {
      const key = normalizeName(suggestion.name)
      if (key) index.set(key, suggestion)
    }
    return index
  }, [suggestions])

  return { suggestions, loading, refresh, byName }
}

/** Busca una sugerencia por nombre, tolerando espacios y mayúsculas. */
export function findSuggestion(
  index: Map<string, ProductSuggestion>,
  name: string,
): ProductSuggestion | undefined {
  return index.get(normalizeName(name))
}

/** Unidades ya usadas en el catálogo, para ofrecerlas antes que las genéricas. */
export function unitsFromSuggestions(suggestions: ProductSuggestion[]): string[] {
  const seen = new Set<string>()
  const units: string[] = []
  for (const suggestion of suggestions) {
    const unit = (suggestion.unit || DEFAULT_UNIT).trim()
    if (unit && !seen.has(unit)) {
      seen.add(unit)
      units.push(unit)
    }
  }
  return units
}

/** Filtrado de ventas por rango de fechas. */

import { formatDate, todayIso } from './format'

export type DatePresetId = 'all' | 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'custom'

export interface DateRange {
  preset: DatePresetId
  /** Solo se usan cuando `preset === 'custom'`, en formato YYYY-MM-DD. */
  from: string
  to: string
}

export const EMPTY_RANGE: DateRange = { preset: 'all', from: '', to: '' }

interface PresetDef {
  id: DatePresetId
  label: string
}

export const DATE_PRESETS: PresetDef[] = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'lastMonth', label: 'Mes pasado' },
  { id: 'year', label: 'Este año' },
  { id: 'custom', label: 'Personalizado' },
]

/** Suma (o resta) días a una fecha YYYY-MM-DD sin desfases de zona horaria. */
function shiftIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + days)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

function firstDayOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

/**
 * Convierte el rango elegido en dos fechas YYYY-MM-DD inclusivas.
 * Devuelve `null` cuando no hay filtro (preset "all" o rango a medias).
 */
export function resolveRange(range: DateRange): { from: string; to: string } | null {
  const today = todayIso()

  switch (range.preset) {
    case 'all':
      return null
    case 'today':
      return { from: today, to: today }
    // Los presets se cuentan hacia atrás desde hoy, incluyéndolo.
    case 'week':
      return { from: shiftIso(today, -6), to: today }
    case 'month':
      return { from: firstDayOfMonth(today), to: today }
    case 'lastMonth': {
      const firstOfThis = firstDayOfMonth(today)
      const lastOfPrev = shiftIso(firstOfThis, -1)
      return { from: firstDayOfMonth(lastOfPrev), to: lastOfPrev }
    }
    case 'year':
      return { from: `${today.slice(0, 4)}-01-01`, to: today }
    case 'custom': {
      const from = range.from || range.to
      const to = range.to || range.from
      if (!from && !to) return null
      return { from, to }
    }
    default:
      return null
  }
}

/**
 * ¿`iso` (YYYY-MM-DD) cae dentro del rango? Compara cadenas porque el formato
 * ISO ordena igual que la fecha, así se evitan líos de zona horaria.
 */
export function isWithin(iso: string | null | undefined, range: DateRange): boolean {
  const bounds = resolveRange(range)
  if (!bounds) return true
  if (!iso) return false
  const day = iso.slice(0, 10)
  if (bounds.from && day < bounds.from) return false
  if (bounds.to && day > bounds.to) return false
  return true
}

/** Describe el rango activo, para mostrarlo junto al filtro. */
export function describeRange(range: DateRange): string {
  const bounds = resolveRange(range)
  if (!bounds) return 'Todo el historial'
  if (bounds.from === bounds.to) return formatDate(bounds.from)
  return `${formatDate(bounds.from)} – ${formatDate(bounds.to)}`
}

/** ¿El usuario ya eligió un rango concreto? */
export function hasActiveRange(range: DateRange): boolean {
  return resolveRange(range) !== null
}

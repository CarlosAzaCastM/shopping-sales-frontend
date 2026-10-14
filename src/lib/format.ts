/** Small formatting helpers shared by the UI. Pesos mexicanos (MXN). */

/** Override with VITE_CURRENCY if you ever need another currency. */
export const CURRENCY = (import.meta.env.VITE_CURRENCY ?? 'MXN').toUpperCase()

export const LOCALE = 'es-MX'

/** Full amount with the currency symbol, e.g. "$1,234.56". */
const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Bare amount for table cells, e.g. "1,234.56" (symbol lives in the header). */
const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** The currency symbol on its own ("$" for MXN), for headers and badges. */
export const CURRENCY_SYMBOL =
  currencyFormatter.formatToParts(0).find((part) => part.type === 'currency')?.value ?? '$'

/** Parse a value that may arrive as a string (PostgreSQL NUMERIC) or number. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** "$1,234.56" */
export function formatMoney(value: string | number | null | undefined): string {
  return currencyFormatter.format(toNumber(value))
}

/** "1,234.56" — for dense tables where the symbol is in the header. */
export function formatAmount(value: string | number | null | undefined): string {
  return amountFormatter.format(toNumber(value))
}

/** "+1,234.56" / "-1,234.56" — always signed, handy for profit columns. */
export function formatSigned(value: string | number | null | undefined): string {
  const amount = toNumber(value)
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${amountFormatter.format(Math.abs(amount))}`
}

/** "40%" / "-20%" */
export function formatPercent(value: number | null | undefined): string {
  const pct = value ?? 0
  return `${pct.toFixed(2).replace(/\.00$/, '')}%`
}

/** "13 oct 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  // A DATE column ("2026-10-13") must not be shifted by the local timezone.
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = isoDateOnly ? new Date(`${value}T12:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** "2026-10-13" for <input type="date">, using the local calendar day. */
export function todayIso(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

/** Round to 2 decimals without float artefacts like 0.30000000000000004. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Margin over the sale price: (price - cost) / price × 100.
 * Returns 0 when the sale price is 0, matching the API.
 */
export function marginPercent(cost: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  return round2(((salePrice - cost) / salePrice) * 100)
}

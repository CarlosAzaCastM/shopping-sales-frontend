import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, api } from '../lib/api'
import { round2, toNumber } from '../lib/format'
import type { Sale, SaleCreate, SaleUpdate, SalesSummary } from '../types'

/** Local fallback totals, used to keep the cards responsive while loading. */
export interface DerivedTotals {
  salesCount: number
  unitsSold: number
  totalCost: number
  totalRevenue: number
  profit: number
  marginPct: number
  bestSaleName: string | null
  bestSaleProfit: number
}

export interface UseSales {
  sales: Sale[]
  summary: SalesSummary | null
  totals: DerivedTotals
  loading: boolean
  error: string | null
  busyIds: ReadonlySet<number>
  addSale: (payload: SaleCreate) => Promise<void>
  editSale: (id: number, payload: SaleUpdate) => Promise<void>
  removeSale: (id: number) => Promise<void>
  refresh: () => Promise<void>
  dismissError: () => void
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Ha ocurrido un error inesperado.'
}

const EMPTY_TOTALS: DerivedTotals = {
  salesCount: 0,
  unitsSold: 0,
  totalCost: 0,
  totalRevenue: 0,
  profit: 0,
  marginPct: 0,
  bestSaleName: null,
  bestSaleProfit: 0,
}

/** Recompute the dashboard figures from the rows the client already has. */
export function deriveTotals(sales: Sale[]): DerivedTotals {
  if (sales.length === 0) return EMPTY_TOTALS

  let totalCost = 0
  let totalRevenue = 0
  let unitsSold = 0
  let bestSaleName: string | null = null
  let bestSaleProfit = Number.NEGATIVE_INFINITY

  for (const sale of sales) {
    totalCost += toNumber(sale.total_cost)
    totalRevenue += toNumber(sale.total_revenue)
    unitsSold += sale.quantity || 0

    const profit = toNumber(sale.profit)
    if (profit > bestSaleProfit) {
      bestSaleProfit = profit
      bestSaleName = sale.name
    }
  }

  const profit = round2(totalRevenue - totalCost)
  return {
    salesCount: sales.length,
    unitsSold,
    totalCost: round2(totalCost),
    totalRevenue: round2(totalRevenue),
    profit,
    marginPct: totalRevenue > 0 ? round2((profit / totalRevenue) * 100) : 0,
    bestSaleName,
    bestSaleProfit: bestSaleProfit === Number.NEGATIVE_INFINITY ? 0 : round2(bestSaleProfit),
  }
}

export function useSales(): UseSales {
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<ReadonlySet<number>>(new Set())

  const markBusy = useCallback((id: number, busy: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api.salesSummary())
    } catch {
      // The card totals fall back to the locally derived figures.
      setSummary(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSales(await api.listSales())
      setError(null)
      await loadSummary()
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [loadSummary])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addSale = useCallback(
    async (payload: SaleCreate) => {
      try {
        const created = await api.createSale(payload)
        setSales((current) => [created, ...current])
        setError(null)
        void loadSummary()
      } catch (err) {
        setError(messageOf(err))
        throw err
      }
    },
    [loadSummary],
  )

  const editSale = useCallback(
    async (id: number, payload: SaleUpdate) => {
      markBusy(id, true)
      const snapshot = sales
      setSales((current) =>
        current.map((sale) => (sale.id === id ? { ...sale, ...payload } : sale)),
      )
      try {
        const updated = await api.updateSale(id, payload)
        setSales((current) => current.map((sale) => (sale.id === id ? updated : sale)))
        setError(null)
        void loadSummary()
      } catch (err) {
        setSales(snapshot)
        setError(messageOf(err))
        throw err
      } finally {
        markBusy(id, false)
      }
    },
    [sales, markBusy, loadSummary],
  )

  const removeSale = useCallback(
    async (id: number) => {
      markBusy(id, true)
      const snapshot = sales
      setSales((current) => current.filter((sale) => sale.id !== id))
      try {
        await api.deleteSale(id)
        setError(null)
        void loadSummary()
      } catch (err) {
        setSales(snapshot)
        setError(messageOf(err))
        throw err
      } finally {
        markBusy(id, false)
      }
    },
    [sales, markBusy, loadSummary],
  )

  const derived = useMemo(() => deriveTotals(sales), [sales])

  // Prefer the server's figures once they arrive; they are the source of truth.
  const totals = useMemo<DerivedTotals>(() => {
    if (!summary) return derived
    return {
      salesCount: summary.sales_count,
      unitsSold: summary.units_sold,
      totalCost: toNumber(summary.total_cost),
      totalRevenue: toNumber(summary.total_revenue),
      profit: toNumber(summary.profit),
      marginPct: summary.margin_pct,
      bestSaleName: summary.best_sale_name,
      bestSaleProfit: toNumber(summary.best_sale_profit),
    }
  }, [summary, derived])

  return {
    sales,
    summary,
    totals,
    loading,
    error,
    busyIds,
    addSale,
    editSale,
    removeSale,
    refresh,
    dismissError: useCallback(() => setError(null), []),
  }
}

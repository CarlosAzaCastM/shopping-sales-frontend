import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, api } from '../lib/api'
import { round2, toNumber } from '../lib/format'
import type { Item, ItemCreate, ItemUpdate } from '../types'

export interface Totals {
  /** Sum of price × quantity for every item. */
  grand: number
  /** Sum of price × quantity for pending items only. */
  pending: number
  /** Sum of price × quantity for completed items only. */
  completed: number
  /** Lo que costó el inventario de la lista (mismo valor que `grand`). */
  totalCost: number
  /** Number of units across all items. */
  units: number
}

export interface UseShoppingList {
  items: Item[]
  loading: boolean
  error: string | null
  busyIds: ReadonlySet<number>
  totals: Totals
  pendingCount: number
  completedCount: number
  addItem: (payload: ItemCreate) => Promise<void>
  editItem: (id: number, payload: ItemUpdate) => Promise<void>
  toggleItem: (item: Item) => Promise<void>
  removeItem: (id: number) => Promise<void>
  clearCompleted: () => Promise<void>
  refresh: () => Promise<void>
  dismissError: () => void
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Ha ocurrido un error inesperado.'
}

export function useShoppingList(): UseShoppingList {
  const [items, setItems] = useState<Item[]>([])
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

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await api.listItems())
      setError(null)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addItem = useCallback(async (payload: ItemCreate) => {
    try {
      const created = await api.createItem(payload)
      // Prepend so the newest item shows first, matching the API ordering.
      setItems((current) => [created, ...current])
      setError(null)
    } catch (err) {
      setError(messageOf(err))
      throw err
    }
  }, [])

  const editItem = useCallback(
    async (id: number, payload: ItemUpdate) => {
      markBusy(id, true)
      const snapshot = items
      // Optimistic update: patch locally, roll back if the request fails.
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...payload } : item)),
      )
      try {
        const updated = await api.updateItem(id, payload)
        setItems((current) => current.map((item) => (item.id === id ? updated : item)))
        setError(null)
      } catch (err) {
        setItems(snapshot)
        setError(messageOf(err))
        throw err
      } finally {
        markBusy(id, false)
      }
    },
    [items, markBusy],
  )

  const toggleItem = useCallback(
    async (item: Item) => {
      await editItem(item.id, { is_completed: !item.is_completed })
    },
    [editItem],
  )

  const removeItem = useCallback(
    async (id: number) => {
      markBusy(id, true)
      const snapshot = items
      setItems((current) => current.filter((item) => item.id !== id))
      try {
        await api.deleteItem(id)
        setError(null)
      } catch (err) {
        setItems(snapshot)
        setError(messageOf(err))
        throw err
      } finally {
        markBusy(id, false)
      }
    },
    [items, markBusy],
  )

  const clearCompleted = useCallback(async () => {
    const snapshot = items
    setItems((current) => current.filter((item) => !item.is_completed))
    try {
      await api.clearCompleted()
      setError(null)
    } catch (err) {
      setItems(snapshot)
      setError(messageOf(err))
      throw err
    }
  }, [items])

  const totals = useMemo<Totals>(() => {
    let grand = 0
    let pending = 0
    let completed = 0
    let totalCost = 0
    let units = 0

    for (const item of items) {
      const quantity = item.quantity || 0
      const line = toNumber(item.price) * quantity
      grand += line
      // En la lista de compras `price` ES el precio de compra, así que el valor
      // del inventario coincide con el total estimado.
      totalCost += line
      units += quantity
      if (item.is_completed) completed += line
      else pending += line
    }

    return {
      grand: round2(grand),
      pending: round2(pending),
      completed: round2(completed),
      totalCost: round2(totalCost),
      units,
    }
  }, [items])

  const pendingCount = useMemo(
    () => items.filter((item) => !item.is_completed).length,
    [items],
  )
  const completedCount = items.length - pendingCount

  return {
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
    dismissError: useCallback(() => setError(null), []),
  }
}

/** Shapes returned by the FastAPI backend. */

/** Unidad de medida por defecto. */
export const DEFAULT_UNIT = 'pza'

/**
 * Unidades sugeridas en los formularios. El campo es libre (acepta cualquier
 * texto), esto solo son atajos para no teclear.
 */
export const COMMON_UNITS = [
  'pza',
  'kg',
  'g',
  'L',
  'ml',
  'm',
  'cm',
  'caja',
  'paquete',
  'docena',
  'bolsa',
  'costal',
  'rollo',
  'par',
] as const

/** A shopping list row. */
export interface Item {
  id: number
  name: string
  quantity: number
  /** Unidad de medida: pza, kg, L, caja... */
  unit: string
  is_completed: boolean
  created_at: string | null
  /** Precio de COMPRA por unidad (lo que pagaste). */
  price: string | number
}

export interface ItemCreate {
  name: string
  quantity: number
  price: number
  unit: string
  is_completed?: boolean
}

export interface ItemUpdate {
  name?: string
  quantity?: number
  price?: number
  unit?: string
  is_completed?: boolean
}

/** A registered sale. `cost` and `sale_price` are per unit. */
export interface Sale {
  id: number
  name: string
  quantity: number
  /** Unidad de medida: pza, kg, L, caja... */
  unit: string
  /** Precio de compra por unidad. */
  cost: string | number
  /** Precio de venta al público por unidad. */
  sale_price: string | number
  sold_at: string
  created_at: string | null
  /** Derived by the API so the UI and the database always agree. */
  total_cost: string | number
  total_revenue: string | number
  profit: string | number
  margin_pct: number
}

export interface SaleCreate {
  name: string
  quantity: number
  cost: number
  sale_price: number
  unit: string
  sold_at?: string
}

export interface SaleUpdate {
  name?: string
  quantity?: number
  cost?: number
  sale_price?: number
  unit?: string
  sold_at?: string
}

/**
 * Un nombre de producto ya usado, para el autocompletado.
 *
 * Se alimenta de la lista de compras y de las ventas, así que un producto
 * antiguo sigue apareciendo aunque ya no esté en la lista.
 */
export interface ProductSuggestion {
  name: string
  unit: string
  uses: number
  last_price: string | number
  last_sale_price: string | number
}

export interface SalesSummary {
  sales_count: number
  units_sold: number
  total_cost: string | number
  total_revenue: string | number
  profit: string | number
  margin_pct: number
  best_sale_name: string | null
  best_sale_profit: string | number
}

export interface Health {
  status: string
  database: string
  server_version?: string | null
  database_host?: string | null
  database_kind?: string | null
}

/** Shapes returned by the FastAPI backend. */

/** A shopping list row. */
export interface Item {
  id: number
  name: string
  quantity: number
  is_completed: boolean
  created_at: string | null
  /** Precio de venta al público, por unidad. */
  price: string | number
  /** Lo que te costó, por unidad. */
  cost: string | number
}

export interface ItemCreate {
  name: string
  quantity: number
  price: number
  cost: number
  is_completed?: boolean
}

export interface ItemUpdate {
  name?: string
  quantity?: number
  price?: number
  cost?: number
  is_completed?: boolean
}

/** A registered sale. `cost` and `sale_price` are per unit. */
export interface Sale {
  id: number
  name: string
  quantity: number
  cost: string | number
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
  sold_at?: string
}

export interface SaleUpdate {
  name?: string
  quantity?: number
  cost?: number
  sale_price?: number
  sold_at?: string
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
}

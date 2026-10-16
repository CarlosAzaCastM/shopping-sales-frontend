import { useId, useMemo } from 'react'

import { COMMON_UNITS, DEFAULT_UNIT } from '../types'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Unidades ya usadas en el historial; se ofrecen antes que las genéricas. */
  extraUnits?: string[]
  /** Pasa `null` para no dibujar etiqueta (la pone quien lo usa). */
  label?: string | null
  className?: string
}

/**
 * Campo de unidad de medida (pza, kg, L, caja…).
 *
 * Es un campo de texto libre con sugerencias: acepta cualquier unidad que
 * escribas, pero ofrece las comunes y las que ya usaste antes, para no teclear
 * ni inventar variantes ("kilo" vs "kg").
 */
export default function UnitField({
  value,
  onChange,
  extraUnits = [],
  label = 'Unidad',
  className = '',
}: Props) {
  const datalistId = `unidades-${useId()}`

  // Historial primero, luego las comunes, sin duplicados.
  const options = useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const unit of [...extraUnits, ...COMMON_UNITS]) {
      const cleaned = unit.trim()
      const key = cleaned.toLowerCase()
      if (cleaned && !seen.has(key)) {
        seen.add(key)
        list.push(cleaned)
      }
    }
    return list
  }, [extraUnits])

  return (
    <label className={className}>
      {label !== null && (
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          // Nunca dejamos la unidad vacía: cae al valor por defecto.
          if (!value.trim()) onChange(DEFAULT_UNIT)
        }}
        list={datalistId}
        placeholder={DEFAULT_UNIT}
        maxLength={32}
        autoComplete="off"
        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 text-sm text-slate-100 transition outline-none placeholder:text-slate-500 focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30"
      />
      <datalist id={datalistId}>
        {options.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </label>
  )
}

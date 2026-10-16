import { useId } from 'react'

import { DATE_PRESETS, EMPTY_RANGE, describeRange, hasActiveRange } from '../lib/dateRange'
import type { DatePresetId, DateRange } from '../lib/dateRange'

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
  /** id del `<datalist>`; si se omite se genera uno único. */
  idPrefix?: string
  className?: string
}

/**
 * Filtro por fecha: botones de rango rápido más un rango personalizado.
 *
 * Los presets cuentan hacia atrás desde hoy (incluyéndolo), que es lo que se
 * suele consultar: "hoy", "7 días", "este mes"… Con "Personalizado" aparecen dos
 * campos de fecha para elegir el rango exacto.
 */
export default function DateRangeFilter({ value, onChange, idPrefix, className = '' }: Props) {
  const generated = useId()
  const prefix = idPrefix ?? generated
  const fromId = `${prefix}-desde`
  const toId = `${prefix}-hasta`
  const active = hasActiveRange(value)

  function selectPreset(preset: DatePresetId) {
    if (preset === 'custom') {
      // Al entrar en personalizado, partimos de un rango razonable (este mes)
      // para que los campos no aparezcan vacíos.
      onChange({ preset, from: value.from, to: value.to })
      return
    }
    onChange({ ...EMPTY_RANGE, preset })
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Fecha
        </span>

        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset.id)}
            aria-pressed={value.preset === preset.id}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              value.preset === preset.id
                ? 'bg-brand-500 text-white shadow shadow-brand-500/25'
                : 'border border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}

        {active && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_RANGE)}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:text-brand-300"
            title="Quitar el filtro de fecha"
          >
            ✕ Quitar
          </button>
        )}
      </div>

      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={fromId} className="flex items-center gap-1.5 text-xs text-slate-500">
            Desde
            <input
              id={fromId}
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
              className="rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
          <label htmlFor={toId} className="flex items-center gap-1.5 text-xs text-slate-500">
            Hasta
            <input
              id={toId}
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
              className="rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30"
            />
          </label>
        </div>
      )}

      <p className="text-[11px] text-slate-500">{describeRange(value)}</p>
    </div>
  )
}

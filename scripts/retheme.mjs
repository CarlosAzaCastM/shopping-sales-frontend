#!/usr/bin/env node
/**
 * Reescribe la paleta antigua (sky/violet/emerald/amber/rose) por la de la marca.
 *
 * Se ejecuta con Node (no PowerShell) a propósito: fs.readFileSync/writeFileSync
 * con 'utf8' preserva los emojis y los acentos. Un Set-Content de PowerShell
 * convierte mal el UTF-8 y rompe el texto (nos pasó una vez).
 *
 * Uso:
 *   node scripts/retheme.mjs           # aplica los cambios
 *   node scripts/retheme.mjs --dry     # solo reporta
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const SRC = join(here, '..', 'src')
const dry = process.argv.includes('--dry')

// El orden importa: primero las variantes más específicas.
const MAP = new Map([
  // --- acciones principales (sky -> brand) ---
  ['shadow-sky-500/25', 'shadow-brand-500/30'],
  ['shadow-sky-500/30', 'shadow-brand-500/30'],
  ['focus-visible:ring-sky-300', 'focus-visible:ring-brand-300'],
  ['focus:border-sky-400/70', 'focus:border-brand-500/70'],
  ['focus:ring-sky-400/30', 'focus:ring-brand-500/30'],
  ['border-sky-400/40', 'border-brand-500/40'],
  ['hover:border-sky-400/50', 'hover:border-brand-400/60'],
  ['bg-sky-500/20', 'bg-brand-500/20'],
  ['bg-sky-500/15', 'bg-brand-500/15'],
  ['bg-sky-500', 'bg-brand-500'],
  ['text-sky-300', 'text-brand-300'],
  ['text-sky-200', 'text-brand-200'],
  ['hover:bg-sky-400', 'hover:bg-brand-400'],

  // --- sección de ventas (violet -> brand) ---
  ['focus:border-violet-400/70', 'focus:border-brand-500/70'],
  ['focus:ring-violet-400/30', 'focus:ring-brand-500/30'],
  ['focus-visible:ring-violet-300', 'focus-visible:ring-brand-300'],
  ['shadow-violet-500/25', 'shadow-brand-500/30'],
  ['border-violet-400/30', 'border-brand-500/40'],
  ['bg-violet-500/20', 'bg-brand-500/20'],
  ['bg-violet-500/5', 'bg-brand-500/5'],
  ['bg-violet-500', 'bg-brand-500'],
  ['hover:bg-violet-400', 'hover:bg-brand-400'],
  ['text-violet-300', 'text-brand-300'],

  // --- éxito / ganancia (emerald -> accent teal) ---
  ['hover:border-emerald-400/50', 'hover:border-accent-400/60'],
  ['hover:text-emerald-200', 'hover:text-accent-200'],
  ['bg-emerald-500/15', 'bg-accent-500/15'],
  ['hover:bg-emerald-500/25', 'hover:bg-accent-500/25'],
  ['hover:bg-emerald-500/15', 'hover:bg-accent-500/15'],
  ['bg-emerald-500/10', 'bg-accent-500/10'],
  ['border-emerald-400/40', 'border-accent-400/40'],
  ['border-emerald-400/30', 'border-accent-400/30'],
  ['bg-emerald-500', 'bg-accent-600'],
  ['hover:bg-emerald-400', 'hover:bg-accent-500'],
  ['bg-emerald-400', 'bg-accent-400'],
  ['text-emerald-400', 'text-accent-400'],
  ['text-emerald-300', 'text-accent-300'],

  // --- costo (amber -> sand) ---
  ['focus:border-amber-400/70', 'focus:border-sand-400/70'],
  ['focus:ring-amber-400/30', 'focus:ring-sand-400/30'],
  ['text-amber-300', 'text-sand-300'],
  ['text-amber-400', 'text-sand-400'],

  // --- pérdida / borrar (rose -> danger) ---
  ['border-rose-400/40', 'border-danger-400/50'],
  ['border-rose-400/30', 'border-danger-400/30'],
  ['hover:border-rose-400/40', 'hover:border-danger-400/50'],
  ['bg-rose-500/15', 'bg-danger-500/15'],
  ['bg-rose-500/10', 'bg-danger-500/10'],
  ['bg-rose-400', 'bg-danger-400'],
  ['hover:bg-rose-500/15', 'hover:bg-danger-500/15'],
  ['hover:bg-rose-500/10', 'hover:bg-danger-500/10'],
  ['text-rose-100', 'text-danger-100'],
  ['text-rose-200', 'text-danger-200'],
  ['text-rose-300', 'text-danger-300'],
  ['text-rose-400', 'text-danger-400'],
])

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return ['.ts', '.tsx'].includes(extname(full)) ? [full] : []
  })
}

let total = 0
for (const file of walk(SRC)) {
  const original = readFileSync(file, 'utf8')
  let text = original
  let count = 0

  for (const [from, to] of MAP) {
    const hits = text.split(from).length - 1
    if (hits > 0) {
      text = text.split(from).join(to)
      count += hits
    }
  }

  if (count > 0) {
    console.log(`${relative(SRC, file).padEnd(42)} ${String(count).padStart(3)} reemplazos`)
    total += count
    if (!dry) writeFileSync(file, text, 'utf8')
  }
}

console.log(`\nTotal: ${total} reemplazos${dry ? ' (simulación, sin escribir)' : ''}`)

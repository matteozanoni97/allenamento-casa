// Collegamento diretto: ?durata=20&attrezzi=manubri,trave&focus=gambe&senzaSalti=1&avvia=1
// apre l'app con la sessione gia' impostata. I valori non validi si ignorano in silenzio.

import { RULES } from '../core/rules.js'

const DURATE = Object.keys(RULES.SPLIT).map(Number)
const ATTREZZI = ['manubri', 'trave']
const FOCUS = ['tutto', 'gambe', 'alto', 'core']
const SI = new Set(['1', 'true', 'si'])

export function parseDeepLink(search) {
  const q = new URLSearchParams(search)
  const out = {}
  const d = Number(q.get('durata'))
  if (DURATE.includes(d)) out.durataMin = d
  if (q.has('attrezzi')) {
    const lista = q.get('attrezzi').split(',').map((s) => s.trim()).filter((s) => ATTREZZI.includes(s))
    if (lista.length || q.get('attrezzi') === '') {
      out.attrezzi = { manubri: lista.includes('manubri'), trave: lista.includes('trave') }
    }
  }
  if (FOCUS.includes(q.get('focus'))) out.focus = q.get('focus')
  if (SI.has(q.get('senzaSalti'))) out.senzaSalti = true
  if (SI.has(q.get('avvia'))) out.avvia = true
  return out
}

export function buildDeepLink(base, opts) {
  const q = new URLSearchParams()
  if (opts.durataMin) q.set('durata', String(opts.durataMin))
  if (opts.attrezzi) q.set('attrezzi', ATTREZZI.filter((a) => opts.attrezzi[a]).join(','))
  if (opts.focus) q.set('focus', opts.focus)
  if (opts.senzaSalti) q.set('senzaSalti', '1')
  if (opts.avvia) q.set('avvia', '1')
  const s = q.toString()
  return s ? `${base}?${s}` : base
}

// Adattamento dei livelli dal voto di fine sessione (session-RPE ancorato, Foster 2001;
// progressione "2 per 2", Suchomel 2021). Funzioni pure: restituiscono nuovi livelli.

import { RULES } from './rules.js'
import { byId } from './catalog.js'

const clamp = (l) => Math.min(RULES.LEVEL_MAX, Math.max(RULES.LEVEL_MIN, l))
const FORZA = ['gambe', 'anca', 'spinta', 'trazione']

export function defaultLevels() {
  const l = { generale: RULES.LEVEL_START, streak: {} }
  for (const m of RULES.MOVEMENTS) l[m] = RULES.LEVEL_START
  return l
}

// voto: 'facile' | 'giusta' | 'faticosa' | 'difficile'
export function applyVote(levels, session, voto, saltati) {
  const out = { ...levels, streak: { ...levels.streak } }
  const skipped = new Set(saltati)
  const perMov = new Map()
  for (const id of session.esercizi) {
    const e = byId(id)
    if (!e) continue
    if (!perMov.has(e.movimento)) perMov.set(e.movimento, [])
    perMov.get(e.movimento).push(id)
  }
  // Il livello generale regola tempi e ripetizioni del formato: si adatta sempre.
  const targets = [...perMov].map(([m, ids]) => ({ m, tuttiSaltati: ids.every((id) => skipped.has(id)) }))
  targets.push({ m: 'generale', tuttiSaltati: false })

  for (const { m, tuttiSaltati } of targets) {
    if (voto === 'difficile') {
      out[m] = clamp(out[m] - 1)
      out.streak[m] = 0
      continue
    }
    // Nelle sessioni leggere solo "troppo difficile" ha effetto.
    if (session.leggera) continue
    if (voto === 'faticosa') {
      out.streak[m] = 0
    } else if (voto === 'facile') {
      if (!tuttiSaltati) out[m] = clamp(out[m] + 1)
      out.streak[m] = 0
    } else if (voto === 'giusta' && !tuttiSaltati) {
      const s = (out.streak[m] ?? 0) + 1
      if (s >= 2) {
        out[m] = clamp(out[m] + 1)
        out.streak[m] = 0
      } else {
        out.streak[m] = s
      }
    }
  }
  return out
}

// Manubri piu' pesanti: i movimenti di forza ripartono da una stima prudente.
export function onWeightChange(levels, oldKg, newKg) {
  const out = { ...levels, streak: { ...levels.streak } }
  if (newKg > oldKg) for (const m of FORZA) out[m] = clamp(out[m] - 2)
  return out
}

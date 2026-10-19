// Adattamento dei livelli dal voto di fine sessione (session-RPE ancorato, Foster 2001;
// progressione "2 per 2", Suchomel 2021). Funzioni pure: restituiscono nuovi livelli.

import { RULES } from './rules.js'
import { byId } from './catalog.js'

const clamp = (l) => Math.min(RULES.LEVEL_MAX, Math.max(RULES.LEVEL_MIN, l))

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
  // Ogni sessione con i manubri consuma una sessione di prudenza.
  if ((out.manubriPrudenza ?? 0) > 0 && session.esercizi.some((id) => byId(id)?.attrezzo === 'manubri')) {
    out.manubriPrudenza -= 1
  }
  return out
}

// Voto (o voto corretto) dell'ultima sessione: si riparte dai livelli di prima della
// sessione, ma la prudenza sui manubri resta quella attuale (puo' essere cambiata dopo).
export function revote(current, levelsPrima, session, voto, saltati) {
  const out = applyVote(levelsPrima, session, voto, saltati)
  const prudenzaPrima = levelsPrima.manubriPrudenza ?? 0
  const consumata = prudenzaPrima - (out.manubriPrudenza ?? 0)
  const attuale = current.manubriPrudenza ?? 0
  out.manubriPrudenza = attuale > prudenzaPrima ? attuale : Math.max(0, prudenzaPrima - consumata)
  return out
}

// Manubri piu' pesanti: per qualche sessione coi manubri il formato riparte prudente
// (vedi generator). Corpo libero e trave non cambiano.
export function onWeightChange(levels, oldKg, newKg) {
  const out = { ...levels, streak: { ...levels.streak } }
  if (newKg > oldKg) out.manubriPrudenza = RULES.WEIGHT_CAUTION_SESSIONS
  return out
}

// Unico punto che legge e scrive i dati. Oggi il backend e' localStorage; domani si
// sostituisce con uno che parla col server, e il resto dell'app non cambia.

import { defaultLevels } from './adapt.js'

export const KEY = 'allenamento-casa:v1'
const SCHEMA = 1
const MAX_HISTORY = 500

function defaults() {
  return {
    schemaVersion: SCHEMA,
    settings: { durataMin: 20, attrezzi: { manubri: false, trave: false }, pesoManubri: 10, voce: true, suoni: true },
    levels: defaultLevels(),
    history: [],
  }
}

function isValid(st) {
  return st && st.schemaVersion === SCHEMA
    && st.settings && typeof st.settings === 'object'
    && st.levels && typeof st.levels === 'object'
    && Array.isArray(st.history)
}

// Completa uno stato valido con eventuali campi aggiunti dopo (stessa versione di schema).
function normalize(st) {
  const d = defaults()
  return {
    schemaVersion: SCHEMA,
    settings: { ...d.settings, ...st.settings, attrezzi: { ...d.settings.attrezzi, ...st.settings.attrezzi } },
    levels: { ...d.levels, ...st.levels, streak: { ...st.levels.streak } },
    history: st.history.slice(0, MAX_HISTORY),
  }
}

// Backend del browser: se localStorage non e' accessibile (origine bloccata o
// sandbox), le scritture falliscono in modo esplicito invece di fingere di riuscire.
export function browserBackend(getStorage) {
  try {
    const ls = getStorage()
    ls.getItem('allenamento-casa:prova')
    return ls
  } catch {
    return {
      getItem: () => null,
      setItem() { throw new Error('Archivio del browser non disponibile.') },
      removeItem() {},
    }
  }
}

export function addHistory(state, entry) {
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) }
}

export function createStore(backend) {
  function safeGet(k) {
    try { return backend.getItem(k) } catch { return null }
  }
  // Storage pieno o bloccato: niente eccezioni, ma l'esito torna al chiamante.
  function safeSet(k, v) {
    try {
      backend.setItem(k, v)
      return true
    } catch {
      return false
    }
  }

  function load() {
    const raw = safeGet(KEY)
    if (raw == null) return defaults()
    try {
      const st = JSON.parse(raw)
      if (isValid(st)) return normalize(st)
    } catch { /* gestito sotto */ }
    // Dato illeggibile o di una versione futura: non lo si cancella, lo si mette da parte.
    safeSet(`${KEY}:corrotto`, raw)
    return defaults()
  }

  // true se salvato; false se il browser non lo permette (la UI deve avvisare).
  function save(state) {
    return safeSet(KEY, JSON.stringify(normalize(state)))
  }

  function exportJson(state) {
    return JSON.stringify(normalize(state), null, 2)
  }

  function importJson(text) {
    let st
    try { st = JSON.parse(text) } catch { throw new Error('File non valido: non è un JSON.') }
    if (!isValid(st)) throw new Error('File non valido: non è un backup di Allenamento Casa.')
    return normalize(st)
  }

  return { load, save, exportJson, importJson }
}

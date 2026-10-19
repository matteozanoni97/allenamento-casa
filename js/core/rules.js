// Tutte le soglie dell'app in un posto solo. Le motivazioni e le fonti sono in
// docs/principi-sessione.md: cambiare un numero qui significa cambiare una regola.

const range = (from, to, value) => {
  const out = {}
  for (let l = from; l <= to; l++) out[l] = value
  return out
}

export const RULES = Object.freeze({
  // Minuti: riscaldamento + blocco centrale + defaticamento (scelta di progetto).
  SPLIT: Object.freeze({ 15: [3, 9, 3], 20: [4, 12, 4], 30: [5, 20, 5], 45: [7, 31, 7] }),

  LEVEL_MIN: 1,
  LEVEL_MAX: 10,
  // 4 = gradino 2 raggiungibile da subito (es. piegamenti normali, non sulle ginocchia).
  LEVEL_START: 4,
  MOVEMENTS: Object.freeze(['gambe', 'anca', 'spinta', 'trazione', 'core', 'cardio']),

  // Varieta': esercizi del blocco da evitare se usati nelle ultime N sessioni.
  RECENT_SESSIONS_AVOID: 2,
  // Esercizi saltati spesso: esclusi se saltati in SKIP_MIN delle ultime SKIP_WINDOW sessioni.
  SKIP_WINDOW: 5,
  SKIP_MIN: 2,
  // Una sessione leggera ogni LIGHT_EVERY (monotonia del carico, Foster).
  LIGHT_EVERY: 3,

  // Statico a fine sessione ~30 s per posizione (Behm 2016, Chaabene 2019).
  STRETCH_HOLD_SEC: 30,
  WARMUP_ITEM_SEC: 30,
  // Pausa tra i due blocchi del formato "blocchi" (Agudo-Ortega 2026).
  BLOCK_REST_SEC: 120,

  // Ripetizioni base per livello (formati a ripetizioni).
  REPS: Object.freeze({ 1: 6, 2: 8, 3: 8, 4: 10, 5: 10, 6: 12, 7: 12, 8: 14, 9: 15, 10: 16 }),

  // Coppie lavoro:recupero ammesse per livello (formati a tempo).
  INTERVALS: Object.freeze({
    ...range(1, 3, Object.freeze(['20:20', '30:30'])),
    ...range(4, 6, Object.freeze(['20:20', '30:30', '30:15', '10:10'])),
    ...range(7, 10, Object.freeze(['30:15', '40:20', '10:10', '30:30'])),
  }),
  LIGHT_INTERVALS: Object.freeze(['20:20', '30:30']),

  // Isometrici (plank, sedia al muro, appesi) nei formati a ripetizioni: tenuta a tempo.
  ISO_SEC_PER_REP: 2.5,
  ISO_MIN_SEC: 10,

  // Esercizi minimi nel blocco centrale (i giri ne usano 3).
  MIN_BLOCK: 3,
  // Manubri piu' pesanti: per N sessioni coi manubri il formato scende di LEVELS livelli.
  WEIGHT_CAUTION_SESSIONS: 3,
  WEIGHT_CAUTION_LEVELS: 2,

  // Gradino massimo della scala di progressione raggiungibile a un livello.
  GRADINO_MAX: (level) => 1 + Math.floor((level - 1) / 3),
})

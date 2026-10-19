// Formati del blocco centrale. Ogni formato riceve gli esercizi gia' scelti e ordinati
// dal generatore (movimenti alternati) e produce gli step del blocco, stando nel budget
// di tempo. Valori e motivazioni: js/core/rules.js e docs/principi-sessione.md.

import { RULES } from './rules.js'
import { byId } from './catalog.js'

const clampLevel = (l) => Math.min(RULES.LEVEL_MAX, Math.max(RULES.LEVEL_MIN, l))
const parsePair = (s) => s.split(':').map(Number)

export function estimateSec(steps) {
  let total = 0
  for (const s of steps) total += s.sec ?? s.reps * byId(s.esercizioId).secPerRep
  return total
}

function pickPair({ rng, level, leggera }) {
  return parsePair(rng.pick(leggera ? RULES.LIGHT_INTERVALS : RULES.INTERVALS[clampLevel(level)]))
}

// Quanti esercizi far girare: il massimo fino a 6 per cui l'ultimo e il primo non hanno
// lo stesso movimento (altrimenti il giro successivo ne metterebbe due di fila).
function cycleList(esercizi) {
  const max = Math.min(6, esercizi.length)
  for (let n = max; n >= 2; n--) {
    if (esercizi[n - 1].movimento !== esercizi[0].movimento) return esercizi.slice(0, n)
  }
  return esercizi.slice(0, max)
}

function timedBlock(list, [work, rest], sec, blocco) {
  const n = list.length
  const k = Math.max(1, Math.round((sec + rest) / (work + rest)))
  const steps = []
  for (let i = 0; i < k; i++) {
    const giro = Math.floor(i / n) + 1
    steps.push({ fase: 'blocco', tipo: 'tempo', sec: work, esercizioId: list[i % n].id, blocco, giro })
    if (i < k - 1) steps.push({ fase: 'pausa', tipo: 'tempo', sec: rest, blocco, giro })
  }
  return steps
}

const dynamic = (esercizi) => esercizi.filter((e) => !e.isometrico)

const intervalli = {
  id: 'intervalli',
  nome: 'Intervalli',
  minMin: 0,
  build(ctx) {
    return timedBlock(cycleList(ctx.esercizi), pickPair(ctx), ctx.minuti * 60, 1)
  },
}

const blocchi = {
  id: 'blocchi',
  nome: 'Blocchi',
  minMin: 12,
  build(ctx) {
    const budget = ctx.minuti * 60
    const nb = Math.max(2, Math.floor((ctx.minuti + 2) / 8))
    const blockSec = (budget - (nb - 1) * RULES.BLOCK_REST_SEC) / nb
    const pair = pickPair(ctx)
    const list = cycleList(ctx.esercizi)
    const steps = []
    for (let b = 1; b <= nb; b++) {
      steps.push(...timedBlock(list, pair, blockSec, b))
      if (b < nb) steps.push({ fase: 'pausa', tipo: 'tempo', sec: RULES.BLOCK_REST_SEC, blocco: b, giro: 1 })
    }
    return steps
  },
}

const giri = {
  id: 'giri',
  nome: 'Giri contro il tempo',
  minMin: 0,
  build(ctx) {
    const budget = ctx.minuti * 60
    const pool = dynamic(ctx.esercizi)
    const list = pool.slice(0, Math.min(pool.length, ctx.rng.int(3, 4)))
    const reps0 = RULES.REPS[clampLevel(ctx.level - (ctx.leggera ? 1 : 0))]
    const sumSpr = list.reduce((a, e) => a + e.secPerRep, 0)
    const rounds = Math.max(2, Math.round(budget / (reps0 * sumSpr)))
    const reps = Math.max(3, Math.round(budget / (rounds * sumSpr)))
    const steps = []
    for (let g = 1; g <= rounds; g++) {
      for (const e of list) steps.push({ fase: 'blocco', tipo: 'ripetizioni', reps, esercizioId: e.id, blocco: 1, giro: g })
    }
    steps[0].capSec = budget
    return steps
  },
}

const piramide = {
  id: 'piramide',
  nome: 'Piramide',
  minMin: 0,
  build(ctx) {
    const budget = ctx.minuti * 60
    const pool = dynamic(ctx.esercizi)
    const list = pool.slice(0, Math.min(pool.length, ctx.rng.int(2, 3)))
    const sumSpr = list.reduce((a, e) => a + e.secPerRep, 0)
    let best = null
    for (let ripeti = 1; ripeti <= 4; ripeti++) {
      for (let top = 4; top <= 20; top += 2) {
        const sum = (top / 2) * (top / 2 + 1) // 2 + 4 + ... + top
        const diff = Math.abs(ripeti * sum * sumSpr - budget)
        if (!best || diff < best.diff) best = { ripeti, top, diff }
      }
    }
    const steps = []
    let giro = 0
    for (let r = 0; r < best.ripeti; r++) {
      for (let reps = best.top; reps >= 2; reps -= 2) {
        giro++
        for (const e of list) steps.push({ fase: 'blocco', tipo: 'ripetizioni', reps, esercizioId: e.id, blocco: 1, giro })
      }
    }
    steps[0].capSec = budget
    return steps
  },
}

export const FORMATS = Object.freeze([intervalli, blocchi, giri, piramide])

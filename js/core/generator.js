// Generatore della sessione: funzione pura (input + seme -> sessione).
// Riscaldamento, blocco centrale in uno dei FORMATS, defaticamento con stretching.
// Le regole e le loro fonti sono in docs/principi-sessione.md.

import { RULES } from './rules.js'
import { CATALOG, byId, isDemanding } from './catalog.js'
import { FORMATS, estimateSec } from './formats.js'
import { createRng } from './rng.js'

// Sequenze di movimenti per il blocco: mai due uguali vicini, anche a giro chiuso.
const FOCUS = {
  tutto: ['gambe', 'spinta', 'anca', 'trazione', 'core', 'cardio'],
  gambe: ['gambe', 'core', 'anca', 'cardio', 'gambe', 'anca'],
  alto: ['spinta', 'core', 'trazione', 'cardio', 'spinta', 'trazione'],
  core: ['core', 'gambe', 'core', 'spinta', 'core', 'cardio'],
}

const clamp = (l) => Math.min(RULES.LEVEL_MAX, Math.max(RULES.LEVEL_MIN, l))

function isLight(pers, history) {
  if (pers.umore === 'leggera') return true
  if (pers.umore === 'spinta') return false
  const recenti = history.slice(0, RULES.LIGHT_EVERY - 1)
  return recenti.length === RULES.LIGHT_EVERY - 1 && recenti.every((h) => !h.leggera)
}

function skippedOften(history) {
  const count = new Map()
  for (const h of history.slice(0, RULES.SKIP_WINDOW)) {
    for (const id of new Set(h.saltati ?? [])) count.set(id, (count.get(id) ?? 0) + 1)
  }
  return new Set([...count].filter(([, n]) => n >= RULES.SKIP_MIN).map(([id]) => id))
}

// Tra gli esercizi della stessa scala tiene solo il gradino piu' alto raggiungibile.
function topOfScale(list) {
  const best = new Map()
  for (const e of list) if (e.scala && e.gradino > (best.get(e.scala) ?? 0)) best.set(e.scala, e.gradino)
  return list.filter((e) => !e.scala || e.gradino === best.get(e.scala))
}

// Ordine del circuito, in ordine di priorita':
//   1. mai due movimenti uguali vicini, mai la trave in testa;
//   2. dopo una spinta, una trazione se ne resta una (coppia di antagonisti);
//   3. prima gli esercizi impegnativi, da fare freschi.
function order(list) {
  const rest = [...list]
  const out = []
  while (rest.length) {
    const last = out[out.length - 1]
    const okTesta = (e) => out.length > 0 || e.attrezzo !== 'trave'
    let cands = rest.filter((e) => okTesta(e) && (!last || e.movimento !== last.movimento))
    if (!cands.length) cands = rest.filter(okTesta)
    if (!cands.length) cands = rest
    const pick = (last?.movimento === 'spinta' && cands.find((e) => e.movimento === 'trazione'))
      || cands.find(isDemanding)
      || cands[0]
    rest.splice(rest.indexOf(pick), 1)
    out.push(pick)
  }
  return out
}

function chooseBlock({ rng, allowed, allowedSenzaEsclusioni, levelOf, focus, includi, recent, skipped }) {
  const seq = FOCUS[focus] ?? FOCUS.tutto
  const offset = rng.int(0, seq.length - 1)
  const slots = seq.map((_, i) => seq[(i + offset) % seq.length])
  const chosen = []
  const used = new Set()

  for (const id of includi) {
    const e = byId(id)
    if (e && e.ruolo === 'blocco' && allowed(e) && !used.has(id)) {
      chosen.push(e)
      used.add(id)
      const k = slots.indexOf(e.movimento)
      slots.splice(k >= 0 ? k : slots.length - 1, 1)
    }
  }

  for (const m of slots) {
    const cands = topOfScale(CATALOG.filter((e) => e.ruolo === 'blocco' && e.movimento === m && allowed(e)
      && e.gradino <= RULES.GRADINO_MAX(levelOf(m)))).filter((e) => !used.has(e.id))
    const tiers = [
      cands.filter((e) => !recent.has(e.id) && !skipped.has(e.id)),
      cands.filter((e) => !skipped.has(e.id)),
      cands,
    ]
    const tier = tiers.find((t) => t.length > 0)
    if (!tier) continue
    const e = rng.pick(tier)
    chosen.push(e)
    used.add(e.id)
  }

  // Esclusioni o focus stretti possono lasciare pochi esercizi: si completa fino a
  // MIN_BLOCK con altri esercizi ammessi, preferendo quelli non recenti.
  const fill = (ok) => {
    const extra = CATALOG.filter((e) => e.ruolo === 'blocco' && !used.has(e.id) && ok(e)
      && e.gradino <= RULES.GRADINO_MAX(levelOf(e.movimento)))
    const pref = [extra.filter((e) => !recent.has(e.id) && !skipped.has(e.id)), extra]
    for (const lista of pref) {
      for (const e of rng.shuffle(lista)) {
        if (chosen.length >= RULES.MIN_BLOCK) return
        if (used.has(e.id)) continue
        chosen.push(e)
        used.add(e.id)
      }
    }
  }
  fill(allowed)
  let avviso
  if (chosen.length < RULES.MIN_BLOCK) {
    fill(allowedSenzaEsclusioni)
    avviso = 'Troppi esercizi esclusi: ne ho ripresi alcuni per completare il circuito.'
  }
  return { block: order(chosen), avviso }
}

function timed(fase, ids, sec) {
  return ids.map((esercizioId) => ({ fase, tipo: 'tempo', sec, esercizioId, blocco: 1, giro: 1 }))
}

function warmup({ rng, minuti, block, allowed }) {
  const n = Math.round((minuti * 60) / RULES.WARMUP_ITEM_SEC)
  const tail = []
  const easy = []
  for (const e of block.filter((x) => x.attrezzo !== 'trave')) {
    const facile = e.scala ? CATALOG.find((x) => x.scala === e.scala && x.gradino === 1) : e
    if (facile && allowed(facile) && !facile.isometrico && !easy.includes(facile.id)) easy.push(facile.id)
    if (easy.length === 2) break
  }
  tail.push(...easy)
  if (block.some((e) => e.attrezzo === 'trave')) tail.push('appeso-piedi-terra')
  const mob = rng.shuffle(CATALOG.filter((e) => e.ruolo === 'riscaldamento' && e.attrezzo === 'corpo' && e.id !== 'marcia').map((e) => e.id))
  const head = ['marcia']
  for (let i = 0; head.length + tail.length < n; i++) head.push(mob[i % mob.length])
  // n >= 6 e la coda ha al massimo 3 voci: il taglio non tocca mai la coda.
  return timed('riscaldamento', [...head, ...tail].slice(0, n), RULES.WARMUP_ITEM_SEC)
}

function cooldown({ rng, minuti, block }) {
  const n = Math.round((minuti * 60) / RULES.STRETCH_HOLD_SEC)
  const lavorati = [...new Set(block.map((e) => e.movimento))]
  const all = rng.shuffle(CATALOG.filter((e) => e.ruolo === 'defaticamento'))
  const out = []
  for (const m of lavorati) {
    const s = all.find((e) => e.stretchFor.includes(m) && !out.includes(e.id))
    if (s) out.push(s.id)
  }
  const rest = all.map((e) => e.id).filter((id) => !out.includes(id))
  for (let i = 0; out.length < n; i++) out.push(rest.length ? rest[i % rest.length] : out[i % out.length])
  return timed('defaticamento', out.slice(0, n), RULES.STRETCH_HOLD_SEC)
}

export function generateSession(input) {
  const { durataMin, attrezzi, levels, history = [], seed, now } = input
  const pers = input.pers ?? {}
  const rng = createRng(seed)
  const [wMin, mMin, cMin] = RULES.SPLIT[durataMin]
  const leggera = isLight(pers, history)
  const delta = pers.umore === 'spinta' ? 1 : pers.umore === 'leggera' ? -1 : 0
  const levelOf = (m) => clamp((levels[m] ?? RULES.LEVEL_START) + delta)
  const escludi = new Set(pers.escludi ?? [])

  const allowedSenzaEsclusioni = (e) => (e.attrezzo === 'corpo' || (e.attrezzo === 'manubri' && attrezzi.manubri) || (e.attrezzo === 'trave' && attrezzi.trave))
    && !(pers.senzaSalti && e.salto)
  const allowed = (e) => allowedSenzaEsclusioni(e) && !escludi.has(e.id)

  const recent = new Set(history.slice(0, RULES.RECENT_SESSIONS_AVOID).flatMap((h) => h.esercizi ?? []))
  const { block, avviso } = chooseBlock({
    rng, allowed, allowedSenzaEsclusioni, levelOf, focus: pers.focus ?? 'tutto', includi: pers.includi ?? [], recent, skipped: skippedOften(history),
  })

  const prev = history[0]?.formatoId
  const eligible = FORMATS.filter((f) => f.minMin <= mMin
    && (f.id !== 'giri' || block.length >= 3)
    && (f.id !== 'piramide' || block.length >= 2))
  const pool = eligible.filter((f) => f.id !== prev)

  // Dopo un aumento di peso dei manubri, prudenza sul formato solo se li si usa davvero.
  const prudenza = (levels.manubriPrudenza ?? 0) > 0 && block.some((e) => e.attrezzo === 'manubri')
  const livelloFormato = clamp(levelOf('generale') - (prudenza ? RULES.WEIGHT_CAUTION_LEVELS : 0))

  // Si prova un formato alla volta e si tiene il primo che sta nel budget (±10%):
  // un formato a ripetizioni con esercizi veloci puo' non riuscire a riempirlo.
  const budget = mMin * 60
  // Gli esercizi fissati dall'utente devono esserci: i formati a ripetizioni usano
  // solo i primi della lista e potrebbero lasciarli fuori.
  const fissati = (pers.includi ?? []).filter((id) => block.some((e) => e.id === id))
  const fits = (steps) => Math.abs(estimateSec(steps) - budget) <= budget * 0.1
    && fissati.every((id) => steps.some((st) => st.esercizioId === id))
  let format = null
  let main = null
  for (const f of [...rng.shuffle(pool.length ? pool : eligible), FORMATS[0]]) {
    const steps = f.build({ minuti: mMin, esercizi: block, level: livelloFormato, rng, leggera })
    if (fits(steps) || f === FORMATS[0]) {
      format = f
      main = steps
      break
    }
  }

  const steps = [
    ...warmup({ rng, minuti: wMin, block, allowed }),
    ...main,
    ...cooldown({ rng, minuti: cMin, block }),
  ]
  const esercizi = [...new Set(main.filter((s) => s.esercizioId).map((s) => s.esercizioId))]

  return {
    id: `${now}-${seed}`,
    creata: now,
    durataMin,
    attrezzi: { manubri: !!attrezzi.manubri, trave: !!attrezzi.trave },
    pers,
    formatoId: format.id,
    leggera,
    seed,
    livelloFormato,
    steps,
    esercizi,
    ...(avviso ? { avviso } : {}),
  }
}

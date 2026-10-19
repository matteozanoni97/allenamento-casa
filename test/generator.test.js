import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateSession } from '../js/core/generator.js'
import { estimateSec } from '../js/core/formats.js'
import { byId, CATALOG } from '../js/core/catalog.js'
import { RULES } from '../js/core/rules.js'

const LV = (n = 3) => ({ gambe: n, anca: n, spinta: n, trazione: n, core: n, cardio: n, generale: n, streak: {} })
const base = (o = {}) => ({
  durataMin: 20,
  attrezzi: { manubri: true, trave: true },
  pers: {},
  levels: LV(),
  history: [],
  seed: 11,
  now: '2026-10-19T08:00:00.000Z',
  ...o,
})
const entry = (s, o = {}) => ({
  sessionId: s.id, data: s.creata, durataMin: s.durataMin, formatoId: s.formatoId,
  esercizi: s.esercizi, saltati: [], voto: 'giusta', leggera: s.leggera, ...o,
})
const fasi = (s, f) => s.steps.filter((x) => x.fase === f)
const blockIds = (s) => fasi(s, 'blocco').map((x) => x.esercizioId)
const secOf = (steps) => estimateSec(steps)

test('generator: deterministico', () => {
  assert.deepEqual(generateSession(base()), generateSession(base()))
  assert.notDeepEqual(generateSession(base()).steps, generateSession(base({ seed: 12 })).steps)
})

test('generator: struttura e minuti delle fasi', () => {
  for (const durataMin of [15, 20, 30, 45]) {
    for (let seed = 1; seed <= 8; seed++) {
      const s = generateSession(base({ durataMin, seed }))
      const ordine = s.steps.map((x) => (x.fase === 'pausa' ? 'blocco' : x.fase))
      const primoBlocco = ordine.indexOf('blocco')
      const primoDef = ordine.indexOf('defaticamento')
      assert.ok(ordine.slice(0, primoBlocco).every((f) => f === 'riscaldamento'))
      assert.ok(ordine.slice(primoBlocco, primoDef).every((f) => f === 'blocco'))
      assert.ok(ordine.slice(primoDef).every((f) => f === 'defaticamento'))
      const [w, m, c] = RULES.SPLIT[durataMin]
      const main = s.steps.filter((x) => x.fase === 'blocco' || x.fase === 'pausa')
      assert.equal(secOf(fasi(s, 'riscaldamento')), w * 60)
      assert.equal(secOf(fasi(s, 'defaticamento')), c * 60)
      assert.ok(Math.abs(secOf(main) - m * 60) <= m * 6, `${durataMin}/${seed} blocco ${secOf(main)}`)
    }
  }
})

test('generator: attrezzi spenti non compaiono', () => {
  for (let seed = 1; seed <= 15; seed++) {
    const s = generateSession(base({ seed, attrezzi: { manubri: false, trave: false } }))
    for (const st of s.steps.filter((x) => x.esercizioId)) assert.equal(byId(st.esercizioId).attrezzo, 'corpo')
  }
})

test('generator: senza salti, escludi e includi', () => {
  for (let seed = 1; seed <= 15; seed++) {
    const s = generateSession(base({ seed, pers: { senzaSalti: true, escludi: ['squat'], includi: ['burpee-senza-salto'] } }))
    for (const st of s.steps.filter((x) => x.esercizioId)) {
      assert.equal(byId(st.esercizioId).salto, false)
      assert.notEqual(st.esercizioId, 'squat')
    }
    assert.ok(blockIds(s).includes('burpee-senza-salto'), `seed ${seed}`)
  }
})

test('generator: trave mai prima nel blocco e appeso a piedi a terra nel riscaldamento', () => {
  let conTrave = 0
  for (let seed = 1; seed <= 30; seed++) {
    const s = generateSession(base({ seed }))
    const ids = blockIds(s)
    assert.notEqual(byId(ids[0]).attrezzo, 'trave', `seed ${seed}`)
    if (ids.some((id) => byId(id).attrezzo === 'trave')) {
      conTrave++
      assert.ok(fasi(s, 'riscaldamento').some((x) => x.esercizioId === 'appeso-piedi-terra'), `seed ${seed}`)
    }
  }
  assert.ok(conTrave > 0)
})

test('generator: formato diverso dalla sessione precedente', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s1 = generateSession(base({ seed }))
    const s2 = generateSession(base({ seed: seed + 100, history: [entry(s1)] }))
    assert.notEqual(s2.formatoId, s1.formatoId)
  }
})

test('generator: evita gli esercizi delle ultime 2 sessioni', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const s1 = generateSession(base({ seed }))
    const s2 = generateSession(base({ seed: seed + 50, history: [entry(s1)] }))
    const s3 = generateSession(base({ seed: seed + 90, history: [entry(s2), entry(s1)] }))
    for (const id of new Set(blockIds(s3))) {
      assert.ok(!s1.esercizi.includes(id) && !s2.esercizi.includes(id), `seed ${seed}: ${id}`)
    }
  }
})

test('generator: esercizio saltato spesso non viene proposto', () => {
  const h = (i) => ({ sessionId: `x${i}`, data: '', durataMin: 20, formatoId: 'giri', esercizi: [], saltati: i < 2 ? ['squat'] : [], voto: 'giusta', leggera: false })
  for (let seed = 1; seed <= 20; seed++) {
    const s = generateSession(base({ seed, pers: { focus: 'gambe' }, history: [h(0), h(1), h(2)] }))
    assert.ok(!blockIds(s).includes('squat'), `seed ${seed}`)
  }
})

test('generator: defaticamento con stretching dei movimenti lavorati', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const s = generateSession(base({ seed }))
    const def = fasi(s, 'defaticamento')
    assert.ok(def.every((x) => x.sec === RULES.STRETCH_HOLD_SEC && byId(x.esercizioId).ruolo === 'defaticamento'))
    const lavorati = new Set(blockIds(s).map((id) => byId(id).movimento))
    for (const m of ['gambe', 'anca', 'spinta', 'trazione', 'core']) {
      if (lavorati.has(m)) assert.ok(def.some((x) => byId(x.esercizioId).stretchFor.includes(m)), `seed ${seed}: ${m}`)
    }
  }
})

test('generator: sessione leggera ogni LIGHT_EVERY', () => {
  const h = (leggera) => ({ sessionId: 'x', data: '', durataMin: 20, formatoId: 'giri', esercizi: [], saltati: [], voto: 'giusta', leggera })
  assert.equal(generateSession(base({ history: [h(false), h(false)] })).leggera, true)
  assert.equal(generateSession(base({ history: [h(false), h(true)] })).leggera, false)
  assert.equal(generateSession(base({ history: [] })).leggera, false)
  assert.equal(generateSession(base({ pers: { umore: 'leggera' } })).leggera, true)
  assert.equal(generateSession(base({ history: [h(false), h(false)], pers: { umore: 'spinta' } })).leggera, false)
})

test('generator: umore spinta usa i livelli +1 senza modificarli', () => {
  const levels = LV(3)
  const s = generateSession(base({ levels, pers: { umore: 'spinta' }, attrezzi: { manubri: false, trave: false } }))
  assert.deepEqual(levels, LV(3))
  // livello 3 -> gradino 1; con +1 = 4 -> gradino 2 raggiungibile
  const conScale = Array.from({ length: 20 }, (_, i) => generateSession(base({ seed: i + 1, levels, pers: { umore: 'spinta', focus: 'alto' }, attrezzi: { manubri: false, trave: false } })))
  assert.ok(conScale.some((x) => blockIds(x).some((id) => byId(id).gradino === 2)))
  assert.ok(s.steps.length > 0)
})

test('generator: catalogo povero, sessione comunque valida (review focus 1)', () => {
  const pers = { senzaSalti: true, focus: 'alto' }
  const tutti = CATALOG.filter((e) => e.ruolo === 'blocco').map((e) => e.id)
  const h = { sessionId: 'x', data: '', durataMin: 20, formatoId: 'giri', esercizi: tutti, saltati: [], voto: 'giusta', leggera: false }
  for (let seed = 1; seed <= 10; seed++) {
    const s = generateSession(base({ seed, pers, attrezzi: { manubri: false, trave: false }, history: [h, h] }))
    assert.ok(new Set(blockIds(s)).size >= 2)
    assert.ok(fasi(s, 'defaticamento').length > 0)
  }
})

test('generator: escludere tutto il core lascia una sessione nel budget (review focus 4)', () => {
  const core = CATALOG.filter((e) => e.movimento === 'core').map((e) => e.id)
  for (let seed = 1; seed <= 10; seed++) {
    const s = generateSession(base({ seed, pers: { escludi: core } }))
    assert.ok(blockIds(s).every((id) => byId(id).movimento !== 'core'))
    const main = s.steps.filter((x) => x.fase === 'blocco' || x.fase === 'pausa')
    assert.ok(Math.abs(secOf(main) - 12 * 60) <= 72)
  }
})

test('generator: budget del blocco rispettato su tutta la matrice (codex #1)', () => {
  const fuori = []
  for (const durataMin of [15, 20, 30, 45]) {
    for (const manubri of [false, true]) {
      for (const trave of [false, true]) {
        for (const focus of ['tutto', 'gambe', 'alto', 'core']) {
          for (let seed = 600; seed <= 640; seed++) {
            const s = generateSession(base({ durataMin, seed, attrezzi: { manubri, trave }, pers: { focus }, levels: LV(4) }))
            const m = RULES.SPLIT[durataMin][1] * 60
            const est = secOf(s.steps.filter((x) => x.fase === 'blocco' || x.fase === 'pausa'))
            if (Math.abs(est - m) > m * 0.1) fuori.push(`${durataMin}/${manubri}/${trave}/${focus}/${seed}: ${s.formatoId} ${est}s`)
          }
        }
      }
    }
  }
  assert.deepEqual(fuori, [])
})

test('generator: troppe esclusioni non svuotano il blocco (codex #2)', () => {
  const tutti = CATALOG.filter((e) => e.ruolo === 'blocco').map((e) => e.id)
  const s = generateSession(base({ durataMin: 15, pers: { escludi: tutti } }))
  assert.ok(new Set(blockIds(s)).size >= 2)
  assert.match(s.avviso, /esclus/i)
  const soloGambe = CATALOG.filter((e) => e.ruolo === 'blocco' && e.movimento !== 'gambe').map((e) => e.id)
  for (let seed = 1; seed <= 10; seed++) {
    const g = generateSession(base({ seed, pers: { escludi: soloGambe } }))
    // Il blocco ne ha almeno MIN_BLOCK; la piramide ne usa 2 per scelta.
    assert.ok(new Set(blockIds(g)).size >= 2, `seed ${seed}: ${blockIds(g)}`)
    if (g.formatoId !== 'piramide') assert.ok(new Set(blockIds(g)).size >= 3, `seed ${seed}: ${blockIds(g)}`)
    assert.ok(blockIds(g).every((id) => byId(id).movimento === 'gambe'))
    assert.equal(g.avviso, undefined)
  }
})

test('generator: prudenza dopo manubri piu\' pesanti solo se ci sono manubri (codex #4)', () => {
  const levels = { ...LV(7), manubriPrudenza: 3 }
  const conManubri = generateSession(base({ seed: 5, levels, attrezzi: { manubri: true, trave: false } }))
  const senza = generateSession(base({ seed: 5, levels, attrezzi: { manubri: false, trave: false } }))
  const usaManubri = conManubri.esercizi.some((id) => byId(id).attrezzo === 'manubri')
  assert.ok(usaManubri)
  assert.equal(conManubri.livelloFormato, 5)
  assert.equal(senza.livelloFormato, 7)
})

test('generator: trave mai prima anche nei formati a ripetizioni (codex finale #2)', () => {
  const s = generateSession(base({ durataMin: 15, seed: 142, levels: LV(4), attrezzi: { manubri: false, trave: true } }))
  assert.notEqual(byId(blockIds(s)[0]).attrezzo, 'trave', `${s.formatoId}: ${blockIds(s)}`)
  for (let seed = 1; seed <= 200; seed++) {
    const x = generateSession(base({ durataMin: 15, seed, levels: LV(4), attrezzi: { manubri: false, trave: true } }))
    assert.notEqual(byId(blockIds(x)[0]).attrezzo, 'trave', `seed ${seed} ${x.formatoId}`)
  }
})

test('generator: esercizio isometrico fissato resta nel circuito (codex finale #3)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = generateSession(base({ seed, pers: { includi: ['plank'] }, attrezzi: { manubri: false, trave: false } }))
    assert.ok(blockIds(s).includes('plank'), `seed ${seed} ${s.formatoId}`)
  }
})

test('generator: con due soli esercizi ammessi si completa fino al minimo con avviso (codex finale #6)', () => {
  const tieni = new Set(['squat', 'piegamenti'])
  const escludi = CATALOG.filter((e) => e.ruolo === 'blocco' && !tieni.has(e.id)).map((e) => e.id)
  const s = generateSession(base({ levels: LV(4), pers: { escludi } }))
  assert.match(s.avviso ?? '', /esclus/i)
  assert.ok(new Set(s.esercizi).size >= 2)
})

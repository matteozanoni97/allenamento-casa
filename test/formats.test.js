import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FORMATS, estimateSec } from '../js/core/formats.js'
import { byId } from '../js/core/catalog.js'
import { createRng } from '../js/core/rng.js'

// Sei esercizi che alternano i movimenti, come li prepara il generatore.
const ES = ['squat', 'piegamenti', 'ponte', 'plank', 'affondo-indietro', 'mountain-climber'].map(byId)
const fmt = (id) => FORMATS.find((f) => f.id === id)
const ctx = (minuti, o = {}) => ({ minuti, esercizi: ES, level: 4, rng: createRng(minuti), leggera: false, ...o })

test('formats: quattro formati con minMin', () => {
  assert.deepEqual(FORMATS.map((f) => f.id), ['intervalli', 'blocchi', 'giri', 'piramide'])
  assert.equal(fmt('blocchi').minMin, 12)
})

for (const f of ['intervalli', 'blocchi', 'giri', 'piramide']) {
  for (const minuti of [9, 12, 20, 31]) {
    if (f === 'blocchi' && minuti < 12) continue
    test(`formats: ${f} ${minuti} min sta nel budget`, () => {
      const steps = fmt(f).build(ctx(minuti))
      const est = estimateSec(steps)
      assert.ok(Math.abs(est - minuti * 60) <= minuti * 6, `stimati ${est}s su ${minuti * 60}s`)
      for (const s of steps) {
        assert.ok(['blocco', 'pausa'].includes(s.fase))
        assert.ok(s.blocco >= 1 && s.giro >= 1)
        if (s.fase === 'blocco') assert.ok(byId(s.esercizioId), s.esercizioId)
      }
    })
  }
}

test('formats: i formati a ripetizioni hanno il tempo limite sul primo step', () => {
  for (const f of ['giri', 'piramide']) {
    const steps = fmt(f).build(ctx(12))
    assert.equal(steps[0].capSec, 720)
    assert.ok(steps.every((s) => (s.tipo === 'ripetizioni' && s.reps > 0) || (s.tipo === 'tempo' && s.sec > 0)))
  }
})

test('formats: isometrici come tenute a tempo nei formati a ripetizioni', () => {
  assert.equal(byId('plank').isometrico, true)
  let conPlank = 0
  for (const f of ['giri', 'piramide']) {
    for (let seed = 1; seed <= 30; seed++) {
      const steps = fmt(f).build(ctx(20, { rng: createRng(seed) }))
      for (const st of steps.filter((x) => byId(x.esercizioId).isometrico)) {
        conPlank++
        assert.equal(st.tipo, 'tempo', f)
        assert.ok(st.sec >= 5, `${f}: ${st.sec}`)
      }
      for (const st of steps.filter((x) => !byId(x.esercizioId).isometrico)) assert.equal(st.tipo, 'ripetizioni')
    }
  }
  assert.ok(conPlank > 0, 'il plank deve poter comparire')
})

test('formats: intervalli senza due movimenti uguali consecutivi', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const work = fmt('intervalli').build(ctx(20, { rng: createRng(seed) })).filter((s) => s.fase === 'blocco')
    for (let i = 1; i < work.length; i++) {
      assert.notEqual(byId(work[i].esercizioId).movimento, byId(work[i - 1].esercizioId).movimento)
    }
  }
})

test('formats: blocchi uguali con 120 s di pausa tra uno e l\'altro', () => {
  const steps = fmt('blocchi').build(ctx(12))
  const pauseLunghe = steps.filter((s) => s.fase === 'pausa' && s.sec === 120)
  assert.equal(pauseLunghe.length, 1)
  const blocchi = new Set(steps.map((s) => s.blocco))
  assert.equal(blocchi.size, 2)
})

test('formats: sessione leggera ha recupero almeno pari al lavoro', () => {
  for (const f of ['intervalli', 'blocchi']) {
    const steps = fmt(f).build(ctx(20, { leggera: true, level: 9 }))
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i].fase === 'blocco' && steps[i + 1].fase === 'pausa') {
        assert.ok(steps[i + 1].sec >= steps[i].sec, `${f}: ${steps[i].sec}:${steps[i + 1].sec}`)
      }
    }
  }
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPlayer } from '../js/core/player.js'

const T = (fase, sec, esercizioId = 'squat', o = {}) => ({ fase, tipo: 'tempo', sec, esercizioId, blocco: 1, giro: 1, ...o })
const P = (sec) => ({ fase: 'pausa', tipo: 'tempo', sec, blocco: 1, giro: 1 })
const RP = (reps, esercizioId = 'piegamenti', o = {}) => ({ fase: 'blocco', tipo: 'ripetizioni', reps, esercizioId, blocco: 1, giro: 1, ...o })
const s = 1000

const INTERVALLI = [T('blocco', 30, 'squat'), P(30), T('blocco', 30, 'piegamenti'), P(30), T('blocco', 30, 'ponte'), T('defaticamento', 30, 'stretch-cobra')]

test('player: gli step a tempo avanzano da soli', () => {
  const p = createPlayer(INTERVALLI, 0)
  assert.equal(p.state(0).index, 0)
  assert.equal(p.state(0).remainingSec, 30)
  assert.equal(p.state(10 * s).remainingSec, 20)
  assert.equal(p.state(31 * s).index, 1)
  assert.equal(p.state(31 * s).remainingSec, 29)
})

test('player: salto dell\'orologio (telefono in pausa) ritrova lo step giusto (review focus 3)', () => {
  const p = createPlayer(INTERVALLI, 0)
  const st = p.state(95 * s)
  assert.equal(st.index, 3)
  assert.equal(st.remainingSec, 25)
  assert.equal(p.state(10_000 * s).finished, true)
})

test('player: gli step a ripetizioni aspettano "fatto"', () => {
  const p = createPlayer([RP(10), RP(10, 'squat'), T('defaticamento', 30)], 0)
  assert.equal(p.state(500 * s).index, 0)
  assert.equal(p.state(500 * s).remainingSec, null)
  p.next(500 * s)
  assert.equal(p.state(501 * s).index, 1)
})

test('player: la pausa congela il tempo', () => {
  const p = createPlayer(INTERVALLI, 0)
  p.pause(10 * s)
  assert.equal(p.state(100 * s).paused, true)
  assert.equal(p.state(100 * s).remainingSec, 20)
  p.resume(100 * s)
  assert.equal(p.state(105 * s).remainingSec, 15)
  assert.equal(p.state(105 * s).index, 0)
})

test('player: salta registra l\'esercizio e passa al successivo', () => {
  const p = createPlayer(INTERVALLI, 0)
  p.skip(5 * s)
  const st = p.state(5 * s)
  assert.equal(st.index, 1)
  assert.equal(st.remainingSec, 30)
  assert.deepEqual(p.skipped(), ['squat'])
})

test('player: tempo limite del blocco a ripetizioni (review focus 5)', () => {
  const steps = [T('riscaldamento', 30, 'marcia'), RP(10, 'piegamenti', { capSec: 540 }), RP(10, 'squat'), RP(10, 'piegamenti'), T('defaticamento', 30, 'stretch-cobra')]
  const p = createPlayer(steps, 0)
  assert.equal(p.state(100 * s).index, 1)
  assert.equal(p.state(100 * s).phaseEndsInSec, 470)
  assert.equal(p.state(571 * s).index, 4)
  assert.equal(p.state(571 * s).remainingSec, 29)
})

test('player: segnali', () => {
  const p = createPlayer(INTERVALLI, 0)
  const a = p.state(26.5 * s)
  const b = p.state(27.5 * s)
  assert.deepEqual(p.cues(a, b), [{ kind: 'bip' }])
  const c = p.state(29.9 * s)
  const d = p.state(30.1 * s)
  const annuncio = p.cues(c, d)
  assert.equal(annuncio[0].kind, 'annuncia')
  assert.match(annuncio[0].text, /Recupero/)
  assert.match(annuncio[0].text, /poi: Piegamenti/)
  const e = p.state(149 * s)
  const f = p.state(151 * s)
  assert.ok(p.cues(e, f).some((x) => x.kind === 'fineBlocco'))
  const g = p.state(179 * s)
  const h = p.state(181 * s)
  assert.ok(p.cues(g, h).some((x) => x.kind === 'fine'))
})

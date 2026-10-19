import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultLevels, applyVote, onWeightChange } from '../js/core/adapt.js'

// Sessione con gambe (squat, affondo) e spinta (piegamenti): trazione, core, anca assenti.
const S = (o = {}) => ({ esercizi: ['squat', 'affondo-indietro', 'piegamenti'], formatoId: 'intervalli', leggera: false, ...o })

test('adapt: livelli di partenza', () => {
  const l = defaultLevels()
  for (const m of ['gambe', 'anca', 'spinta', 'trazione', 'core', 'cardio', 'generale']) assert.equal(l[m], 4)
  assert.deepEqual(l.streak, {})
})

test('adapt: troppo facile +1 sui movimenti presenti', () => {
  const l = applyVote(defaultLevels(), S(), 'facile', [])
  assert.equal(l.gambe, 5)
  assert.equal(l.spinta, 5)
  assert.equal(l.generale, 5)
  assert.equal(l.trazione, 4)
  assert.equal(l.core, 4)
})

test('adapt: giusta sale solo alla seconda di fila', () => {
  const l1 = applyVote(defaultLevels(), S(), 'giusta', [])
  assert.equal(l1.gambe, 4)
  assert.equal(l1.streak.gambe, 1)
  const l2 = applyVote(l1, S(), 'giusta', [])
  assert.equal(l2.gambe, 5)
  assert.equal(l2.streak.gambe, 0)
})

test('adapt: faticosa invariato e azzera la serie', () => {
  const l1 = applyVote(defaultLevels(), S(), 'giusta', [])
  const l2 = applyVote(l1, S(), 'faticosa', [])
  assert.equal(l2.gambe, 4)
  assert.equal(l2.streak.gambe, 0)
})

test('adapt: troppo difficile -1 e limiti 1..10', () => {
  assert.equal(applyVote(defaultLevels(), S(), 'difficile', []).gambe, 3)
  let l = defaultLevels()
  for (let i = 0; i < 20; i++) l = applyVote(l, S(), 'difficile', [])
  assert.equal(l.gambe, 1)
  for (let i = 0; i < 20; i++) l = applyVote(l, S(), 'facile', [])
  assert.equal(l.gambe, 10)
})

test('adapt: movimento con tutti gli esercizi saltati non sale', () => {
  const l = applyVote(defaultLevels(), S(), 'facile', ['piegamenti'])
  assert.equal(l.spinta, 4)
  assert.equal(l.gambe, 5)
  assert.equal(applyVote(defaultLevels(), S(), 'difficile', ['piegamenti']).spinta, 3)
})

test('adapt: sessione leggera conta solo troppo difficile', () => {
  assert.equal(applyVote(defaultLevels(), S({ leggera: true }), 'facile', []).gambe, 4)
  assert.equal(applyVote(defaultLevels(), S({ leggera: true }), 'giusta', []).streak.gambe ?? 0, 0)
  assert.equal(applyVote(defaultLevels(), S({ leggera: true }), 'difficile', []).gambe, 3)
})

test('adapt: puro, non modifica l\'input', () => {
  const l = defaultLevels()
  applyVote(l, S(), 'facile', [])
  assert.deepEqual(l, defaultLevels())
})

test('adapt: peso dei manubri non tocca corpo libero e trave (codex #4)', () => {
  const l = onWeightChange(defaultLevels(), 10, 12)
  assert.deepEqual([l.gambe, l.anca, l.spinta, l.trazione, l.generale], [4, 4, 4, 4, 4])
  assert.equal(l.manubriPrudenza, 3)
  assert.equal(onWeightChange(defaultLevels(), 10, 8).manubriPrudenza ?? 0, 0)
  const dopo = applyVote(l, { esercizi: ['goblet-squat'], leggera: false }, 'faticosa', [])
  assert.equal(dopo.manubriPrudenza, 2)
  const senzaManubri = applyVote(l, { esercizi: ['squat'], leggera: false }, 'faticosa', [])
  assert.equal(senzaManubri.manubriPrudenza, 3)
})

test('adapt: rivotare conserva la prudenza sui manubri impostata dopo (codex finale #5)', async () => {
  const { revote } = await import('../js/core/adapt.js')
  const prima = defaultLevels()
  const sessione = { esercizi: ['squat', 'piegamenti'], leggera: false }
  const dopoVoto = applyVote(prima, sessione, 'giusta', [])
  const dopoPeso = onWeightChange(dopoVoto, 10, 14)
  const r = revote(dopoPeso, prima, sessione, 'facile', [])
  assert.equal(r.manubriPrudenza, 3)
  assert.equal(r.gambe, 5)
})

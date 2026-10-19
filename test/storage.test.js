import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore, addHistory, KEY } from '../js/core/storage.js'

function memory(init = {}) {
  const m = new Map(Object.entries(init))
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}
const entry = (i) => ({ sessionId: `s${i}`, data: '', durataMin: 20, formatoId: 'giri', esercizi: [], saltati: [], voto: null, leggera: false })

test('storage: chiave e default', () => {
  assert.equal(KEY, 'allenamento-casa:v1')
  const st = createStore(memory()).load()
  assert.equal(st.schemaVersion, 1)
  assert.deepEqual(st.settings, { durataMin: 20, attrezzi: { manubri: false, trave: false }, pesoManubri: 10, voce: true, suoni: true })
  assert.equal(st.levels.gambe, 4)
  assert.deepEqual(st.history, [])
})

test('storage: salva e ricarica', () => {
  const b = memory()
  const store = createStore(b)
  const st = store.load()
  st.settings.durataMin = 30
  st.history = [entry(1)]
  store.save(st)
  assert.deepEqual(createStore(b).load(), st)
})

test('storage: esporta e importa', () => {
  const store = createStore(memory())
  const st = store.load()
  st.settings.pesoManubri = 12
  assert.deepEqual(store.importJson(store.exportJson(st)), st)
})

test('storage: import non valido lascia lo stato com\'era', () => {
  const b = memory()
  const store = createStore(b)
  const st = store.load()
  store.save(st)
  const prima = b.dump()
  assert.throws(() => store.importJson('non json'), /file non valido/i)
  assert.throws(() => store.importJson('{"schemaVersion":1}'), /file non valido/i)
  assert.deepEqual(b.dump(), prima)
})

test('storage: dato corrotto o di versione futura conservato a parte (review focus 2)', () => {
  for (const raw of ['{rotto', JSON.stringify({ schemaVersion: 99 })]) {
    const b = memory({ [KEY]: raw })
    const st = createStore(b).load()
    assert.deepEqual(st.history, [])
    assert.equal(b.getItem(`${KEY}:corrotto`), raw)
  }
})

test('storage: backend che lancia eccezioni non blocca l\'app', () => {
  const rotto = { getItem() { throw new Error('bloccato') }, setItem() { throw new Error('bloccato') }, removeItem() {} }
  const store = createStore(rotto)
  const st = store.load()
  assert.equal(st.schemaVersion, 1)
  assert.doesNotThrow(() => store.save(st))
})

test('storage: storico dal piu\' recente, al massimo 500', () => {
  let st = createStore(memory()).load()
  for (let i = 0; i < 510; i++) st = addHistory(st, entry(i))
  assert.equal(st.history.length, 500)
  assert.equal(st.history[0].sessionId, 's509')
})

test('storage: save dice se il salvataggio e\' riuscito (codex #3)', () => {
  assert.equal(createStore(memory()).save(createStore(memory()).load()), true)
  const pieno = { getItem: () => null, setItem() { throw new Error('QuotaExceededError') }, removeItem() {} }
  const store = createStore(pieno)
  assert.equal(store.save(store.load()), false)
})

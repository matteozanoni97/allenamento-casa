import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CATALOG, byId } from '../js/core/catalog.js'
import { RULES } from '../js/core/rules.js'

const RUOLI = ['blocco', 'riscaldamento', 'defaticamento']
const MOVIMENTI = [...RULES.MOVEMENTS, 'mobilita', 'stretching']
const ATTREZZI = ['corpo', 'manubri', 'trave']

test('catalog: campi validi', () => {
  const ids = new Set()
  for (const e of CATALOG) {
    assert.ok(!ids.has(e.id), `id duplicato ${e.id}`)
    ids.add(e.id)
    assert.ok(RUOLI.includes(e.ruolo), `${e.id} ruolo`)
    assert.ok(MOVIMENTI.includes(e.movimento), `${e.id} movimento`)
    assert.ok(ATTREZZI.includes(e.attrezzo), `${e.id} attrezzo`)
    assert.equal(typeof e.salto, 'boolean', `${e.id} salto`)
    assert.equal(typeof e.unilaterale, 'boolean', `${e.id} unilaterale`)
    assert.equal(typeof e.isometrico, 'boolean', `${e.id} isometrico`)
    assert.ok(e.gradino >= 1 && e.gradino <= 4, `${e.id} gradino`)
    assert.ok(e.secPerRep > 0, `${e.id} secPerRep`)
    assert.ok(e.nome.trim().length > 0, `${e.id} nome`)
    assert.ok(e.istruzione.trim().length > 0, `${e.id} istruzione`)
    for (const s of [e.nome, e.istruzione]) assert.ok(!s.includes('—'), `${e.id} trattino lungo`)
    assert.equal(e.img, e.fedb ? `img/ex/${e.id}.jpg` : null, `${e.id} img`)
    if (e.ruolo === 'defaticamento') assert.ok(Array.isArray(e.stretchFor) && e.stretchFor.length > 0, `${e.id} stretchFor`)
  }
  assert.equal(byId('squat').nome.length > 0, true)
  assert.equal(byId('inesistente'), undefined)
})

test('catalog: scale coerenti', () => {
  const scale = new Map()
  for (const e of CATALOG.filter((x) => x.scala)) {
    if (!scale.has(e.scala)) scale.set(e.scala, [])
    scale.get(e.scala).push(e)
  }
  assert.ok(scale.size >= 4, 'almeno 4 scale')
  for (const [nome, es] of scale) {
    const gradini = es.map((e) => e.gradino).sort((a, b) => a - b)
    assert.deepEqual(gradini, gradini.map((_, i) => i + 1), `scala ${nome}`)
    assert.equal(new Set(es.map((e) => e.movimento)).size, 1, `scala ${nome} un solo movimento`)
  }
})

test('catalog: trave solo prese ampie', () => {
  for (const e of CATALOG.filter((x) => x.attrezzo === 'trave')) {
    assert.match(e.istruzione, /prese ampie/i, e.id)
  }
})

test('catalog: copertura per ogni combinazione di attrezzi', () => {
  for (const manubri of [false, true]) {
    for (const trave of [false, true]) {
      for (const senzaSalti of [false, true]) {
        const ok = (e) => e.ruolo === 'blocco'
          && (e.attrezzo === 'corpo' || (e.attrezzo === 'manubri' && manubri) || (e.attrezzo === 'trave' && trave))
          && !(senzaSalti && e.salto)
          && e.gradino === 1
        const tag = `manubri=${manubri} trave=${trave} senzaSalti=${senzaSalti}`
        for (const m of RULES.MOVEMENTS) {
          const n = CATALOG.filter((e) => ok(e) && e.movimento === m).length
          const min = m === 'trazione' && !manubri && !trave ? 2 : 3
          assert.ok(n >= min, `${tag} ${m}: ${n} < ${min}`)
        }
      }
    }
  }
  assert.ok(CATALOG.filter((e) => e.ruolo === 'riscaldamento').length >= 8)
  const def = CATALOG.filter((e) => e.ruolo === 'defaticamento')
  assert.ok(def.length >= 10)
  for (const m of ['gambe', 'anca', 'spinta', 'trazione', 'core']) {
    assert.ok(def.some((e) => e.stretchFor.includes(m)), `stretching per ${m}`)
  }
  assert.ok(CATALOG.some((e) => e.ruolo === 'riscaldamento' && e.attrezzo === 'trave'), 'appeso a piedi a terra')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RULES } from '../js/core/rules.js'

test('rules: split somma alla durata', () => {
  assert.deepEqual(Object.keys(RULES.SPLIT).map(Number), [15, 20, 30, 45])
  for (const [durata, parti] of Object.entries(RULES.SPLIT)) {
    assert.equal(parti.reduce((a, b) => a + b, 0), Number(durata))
  }
})

test('rules: GRADINO_MAX', () => {
  const got = [1, 3, 4, 7, 10].map(RULES.GRADINO_MAX)
  assert.deepEqual(got, [1, 1, 2, 3, 4])
})

test('rules: tabelle coprono tutti i livelli', () => {
  for (let l = RULES.LEVEL_MIN; l <= RULES.LEVEL_MAX; l++) {
    assert.ok(RULES.REPS[l] > 0, `REPS ${l}`)
    assert.ok(RULES.INTERVALS[l].length > 0, `INTERVALS ${l}`)
  }
  assert.ok(Object.isFrozen(RULES))
})

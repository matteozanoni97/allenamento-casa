import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRng } from '../js/core/rng.js'

test('rng: stesso seme stessa sequenza', () => {
  const a = createRng(42)
  const b = createRng(42)
  const c = createRng(43)
  const sa = Array.from({ length: 10 }, () => a.next())
  const sb = Array.from({ length: 10 }, () => b.next())
  const sc = Array.from({ length: 10 }, () => c.next())
  assert.deepEqual(sa, sb)
  assert.notDeepEqual(sa, sc)
  for (const v of sa) assert.ok(v >= 0 && v < 1)
})

test('rng: int nei limiti', () => {
  const r = createRng(7)
  const seen = new Set()
  for (let i = 0; i < 10000; i++) {
    const v = r.int(1, 6)
    assert.ok(v >= 1 && v <= 6)
    seen.add(v)
  }
  assert.equal(seen.size, 6)
})

test('rng: shuffle non perde elementi e non muta l\'originale', () => {
  const r = createRng(1)
  const src = [1, 2, 3, 4, 5]
  const out = r.shuffle(src)
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5])
  assert.deepEqual(src, [1, 2, 3, 4, 5])
})

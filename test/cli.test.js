import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CLI = fileURLToPath(new URL('../tools/genera.mjs', import.meta.url))
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' })

test('cli: --json produce la sessione', () => {
  const r = run('--durata', '20', '--attrezzi', 'manubri', '--json', '--seed', '7')
  assert.equal(r.status, 0, r.stderr)
  const s = JSON.parse(r.stdout)
  assert.equal(s.durataMin, 20)
  assert.equal(s.attrezzi.manubri, true)
  assert.equal(s.seed, 7)
})

test('cli: anteprima testuale con link', () => {
  const r = run('--durata', '15', '--attrezzi', 'trave', '--focus', 'alto', '--senza-salti', '--seed', '3')
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /Riscaldamento 3 min/)
  assert.match(r.stdout, /durata=15/)
  assert.match(r.stdout, /attrezzi=trave/)
  assert.match(r.stdout, /focus=alto/)
  assert.match(r.stdout, /senzaSalti=1/)
})

test('cli: argomenti non validi', () => {
  for (const args of [['--durata', '17'], ['--attrezzi', 'bilanciere'], ['--focus', 'braccia'], ['--boh']]) {
    const r = run(...args)
    assert.equal(r.status, 2, args.join(' '))
    assert.match(r.stderr, /Uso:/)
  }
})

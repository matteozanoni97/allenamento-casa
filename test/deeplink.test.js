import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDeepLink, buildDeepLink } from '../js/ui/deeplink.js'

test('deeplink: legge durata, attrezzi e focus', () => {
  assert.deepEqual(parseDeepLink('?durata=20&attrezzi=manubri,trave&focus=gambe'), {
    durataMin: 20, attrezzi: { manubri: true, trave: true }, focus: 'gambe',
  })
})

test('deeplink: valori non validi ignorati', () => {
  assert.deepEqual(parseDeepLink('?durata=17&attrezzi=bilanciere&focus=braccia'), {})
  assert.deepEqual(parseDeepLink('?attrezzi=manubri,bilanciere'), { attrezzi: { manubri: true, trave: false } })
  assert.deepEqual(parseDeepLink(''), {})
})

test('deeplink: senza salti e avvio', () => {
  assert.deepEqual(parseDeepLink('?senzaSalti=1&avvia=1'), { senzaSalti: true, avvia: true })
  assert.deepEqual(parseDeepLink('?attrezzi='), { attrezzi: { manubri: false, trave: false } })
})

test('deeplink: andata e ritorno', () => {
  const opts = { durataMin: 30, attrezzi: { manubri: false, trave: true }, focus: 'alto', senzaSalti: true }
  const url = buildDeepLink('https://example.org/app/', opts)
  assert.match(url, /^https:\/\/example\.org\/app\/\?/)
  assert.deepEqual(parseDeepLink(new URL(url).search), opts)
})

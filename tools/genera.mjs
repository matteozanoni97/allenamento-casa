#!/usr/bin/env node
// Genera una sessione da terminale con lo stesso nucleo dell'app (usata dalla skill
// `allenamento` del brain). Stampa un'anteprima e il collegamento diretto all'app.
//
// L'anteprima e' un esempio con i livelli di partenza e senza storico: sul telefono
// l'app genera la sua sessione con gli stessi parametri, i livelli e lo storico reali.

import { parseArgs } from 'node:util'
import { generateSession } from '../js/core/generator.js'
import { defaultLevels } from '../js/core/adapt.js'
import { byId } from '../js/core/catalog.js'
import { FORMATS } from '../js/core/formats.js'
import { RULES } from '../js/core/rules.js'
import { buildDeepLink } from '../js/ui/deeplink.js'

const BASE = process.env.ALLENAMENTO_URL ?? 'https://matteozanoni97.github.io/allenamento-casa/'
const USO = `Uso: node tools/genera.mjs --durata 15|20|30|45 [--attrezzi manubri,trave] [--focus tutto|gambe|alto|core] [--senza-salti] [--seed N] [--json]`

function fail(msg) {
  process.stderr.write(`${msg}\n${USO}\n`)
  process.exit(2)
}

let args
try {
  args = parseArgs({
    options: {
      durata: { type: 'string', default: '20' },
      attrezzi: { type: 'string', default: '' },
      focus: { type: 'string', default: 'tutto' },
      'senza-salti': { type: 'boolean', default: false },
      seed: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  }).values
} catch (e) {
  fail(`Argomento non riconosciuto: ${e.message}`)
}

const durataMin = Number(args.durata)
if (!RULES.SPLIT[durataMin]) fail(`Durata non valida: ${args.durata}.`)
const lista = args.attrezzi ? args.attrezzi.split(',').map((s) => s.trim()) : []
for (const a of lista) if (!['manubri', 'trave'].includes(a)) fail(`Attrezzo non valido: ${a}.`)
if (!['tutto', 'gambe', 'alto', 'core'].includes(args.focus)) fail(`Focus non valido: ${args.focus}.`)
const seed = args.seed != null ? Number(args.seed) : (Date.now() >>> 0)
if (!Number.isInteger(seed)) fail(`Seed non valido: ${args.seed}.`)

const attrezzi = { manubri: lista.includes('manubri'), trave: lista.includes('trave') }
const pers = { focus: args.focus, ...(args['senza-salti'] ? { senzaSalti: true } : {}) }
const s = generateSession({ durataMin, attrezzi, pers, levels: defaultLevels(), history: [], seed, now: new Date().toISOString() })

if (args.json) {
  process.stdout.write(`${JSON.stringify(s, null, 2)}\n`)
} else {
  const [w, m, c] = RULES.SPLIT[durataMin]
  const f = FORMATS.find((x) => x.id === s.formatoId)
  const link = buildDeepLink(BASE, { durataMin, attrezzi, focus: args.focus === 'tutto' ? undefined : args.focus, senzaSalti: args['senza-salti'] })
  const out = [
    `Sessione da ${durataMin} min, formato: ${f.nome}`,
    `Riscaldamento ${w} min, circuito ${m} min, defaticamento ${c} min`,
    '',
    'Circuito (esempio):',
    ...s.esercizi.map((id, i) => `  ${i + 1}. ${byId(id).nome}`),
    '',
    `Apri nell'app: ${link}`,
  ]
  process.stdout.write(`${out.join('\n')}\n`)
}

// Copia in img/ex/<id>.jpg la prima immagine di ogni esercizio del catalogo che ha un
// `fedb`, e scrive img/ex/SOURCES.md con attribuzione e licenza.
//
// Uso: node tools/import-images.mjs [sorgente]
//   sorgente = cartella `exercises/` di un clone di free-exercise-db, oppure (default)
//   l'URL raw del repository su GitHub.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATALOG } from '../js/core/catalog.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'img', 'ex')
const DEFAULT_SRC = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const src = process.argv[2] ?? DEFAULT_SRC

async function load(fedb) {
  if (/^https?:/.test(src)) {
    const res = await fetch(`${src}/${fedb}/0.jpg`)
    if (!res.ok) throw new Error(`${fedb}: HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  return readFile(join(src, fedb, '0.jpg'))
}

await mkdir(OUT, { recursive: true })
const rows = []
const errors = []
for (const e of CATALOG.filter((x) => x.fedb)) {
  try {
    const buf = await load(e.fedb)
    if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error(`${e.fedb}: non e' un JPEG`)
    await writeFile(join(OUT, `${e.id}.jpg`), buf)
    rows.push(`| \`${e.id}.jpg\` | ${e.fedb} |`)
  } catch (err) {
    errors.push(err.message)
  }
}

await writeFile(join(OUT, 'SOURCES.md'), [
  '# Immagini degli esercizi',
  '',
  'Fonte: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), rilasciato',
  'nel pubblico dominio con licenza [Unlicense](https://unlicense.org/). Prima immagine',
  '(`0.jpg`) di ogni esercizio, rinominata con l\'id del catalogo.',
  '',
  '| File | Esercizio d\'origine |',
  '|---|---|',
  ...rows,
  '',
].join('\n'))

console.log(`immagini: ${rows.length} copiate, ${errors.length} errori`)
for (const e of errors) console.error(`  ${e}`)
process.exitCode = errors.length ? 1 : 0
